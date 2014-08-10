var http = require("http");
var https = require("https");
var express = require('express');
var mysql = require('mysql');
var URL_PARSER = require('url');
var BODY_PARSER = require('body-parser');
var MYSQL = require('mysql');
var CONVERSATION = require('/home/ec2-user/git/battle-hacks/messages.js');

var ELIZA = require('/home/ec2-user/git/battle-hacks/eliza/elizabot/elizabot.js').get();

var DATABASE = MYSQL.createConnection({
  host: "battlehacks.cb52ktblegm4.us-west-2.rds.amazonaws.com",
  user: "battlehacker",
  password: "battlehacker",
  database: "battlehacks"
});
DATABASE.connect();

var VENMO_AUTHORIZE_URL = "https://api.venmo.com/v1/oauth/authorize?client_id=1878&scope=make_payments%20access_profile%20access_email%20access_phone%20access_balance&response_type=code"
var VENMO_CHARGE_URL = "https://www.organicparking.com/BattleHack/venmocharge.php?phonenumber=";

var TWILIO_ID = "AC10a570344dac81f70d411dd590ac0e57";
var TWILIO_TOKEN = "c27ad4d332c5e60c37ad93e673b93d9f";
var TWILIO = require('twilio')(TWILIO_ID, TWILIO_TOKEN);

var CMD_ELIZA = "eliza";
var CMD_END_ELIZA = "stop eliza";

var QUERY_CREATE_USER = "INSERT INTO users (phoneNumber, userState) VALUES (?, ?)";
var QUERY_SET_NAME = "UPDATE users SET name=?, userState=? where phoneNumber=?";
var QUERY_SET_CHAR_NAME = "UPDATE users SET charName=?, userState=? where phoneNumber=?";
var QUERY_LAST_PROMPT = "SELECT userState FROM users where phoneNumber=?";
var QUERY_SET_LAST_PROMPT = "UPDATE users SET userState=? WHERE phoneNumber=?";
var QUERY_GET_CHAR_DATA = "SELECT *, CURDATE() - lastUpdate as timeDiff FROM users where phoneNumber=?";
var QUERY_UPDATE_TIME_SENSITIVE_DATA = "UPDATE users SET charSavings=?, charItems=?, lastUpdate=CURDATE()";
var QUERY_SET_ITEMS = "UPDATE users SET charItems=? where phoneNumber=?";
var QUERY_GET_ITEMS = "SELECT charItems FROM users where phoneNumber=?";
var QUERY_GET_VENMO_TOKEN = "SELECT venmoToken FROM users where phoneNumber=?";

var app = express();
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs');
app.use(BODY_PARSER.json());

app.get("/", function (req, res) {
  res.render('index');
});

app.post("/initialize", function(req, res) {
  console.log("initialize");
  console.log("  number:" + req.body.number);
  var number = sanitizePhoneNumber(req.body.number);
  createUser(number, function() {
    res.send(JSON.stringify({phoneNumber: number}));
  });
});

app.post("/donate", function(req, res) {
  console.log("donate:" + req.body.number);
  var number = sanitizePhoneNumber(req.body.number);
  DATABASE.query(QUERY_GET_VENMO_TOKEN, [number], function(err, rows) {
    var url = VENMO_AUTHORIZE_URL;
    if (!err && rows.length === 1 && rows[0].venmoToken) {
      url = VENMO_CHARGE_URL + number;
    } else {
    }
    res.send(JSON.stringify({redirectUrl:url})); 
  });
});

app.get("/incomingSms", function(req, res) {
  console.log("incoming:");
  var queryData = URL_PARSER.parse(req.url, true).query;
  var number = queryData.From.replace("+", "");

  DATABASE.query(QUERY_LAST_PROMPT, [number], function(err, rows) {
    if (err || rows.length != 1) {
      createUser(number, function(){});
    } else {
      var next = CONVERSATION.getNextAction(JSON.parse(rows[0].userState), queryData.Body);
      console.log("next:" + next.message);
      if (next.cost) {
        purchaseItem(number, next.item, next.cost);
      }
      DATABASE.query(QUERY_SET_LAST_PROMPT, [JSON.stringify(next), number], function(err) {
        if (err) {
          console.log("error updating user state");
        } else {
          sendMessage(next.message, number);
        }
      });
    }
  });
});

app.get("/character", function(req, res) {
  var number = URL_PARSER.parse(req.url, true).query.phoneNumber;
  if (!number) {
    console.log("getting number from cookies...");
    res.render('getnumber');
    return;
  }
  getCharData(number, function(data) {
    data['number'] = number;
    res.render('character', data);
  });
});

app.post("/purchaseItem", function(req, res) {
  var number = req.body.number;
  var itemId = req.body.itemId;
  console.log("purchasing:" + itemId);
  purchaseItem(number, itemId);
});

app.listen(8000);

var purchaseItem = function(number, itemId) {
  DATABASE.query(QUERY_GET_ITEMS, [number], function (err, rows) {
    if (err || rows.length != 1) {
      console.log("error getting items for:" + number);
      return;
    }
    console.log("inserting: " + itemId + " into " + rows[0].charItems);
    if (rows[0].charItems) console.log("exists");
    var oldItems = rows[0].charItems ? JSON.parse(rows[0].charItems) : {};
    oldItems[itemId] = 100;
    var newItems = JSON.stringify(oldItems);
    DATABASE.query(QUERY_SET_ITEMS, [newItems, number], function (err) {
      if (err) {
        console.log("error setting items for:" + number + "  " + err);
      } {
        console.log("sending email");
        https.get("https://www.organicparking.com/BattleHack/emailnews.php", function(res){
          console.log("sent email:" + res.statusCode);
        });
      }
    });
  });
}

var getCharData = function(number, callback) {
  DATABASE.query(QUERY_GET_CHAR_DATA, [number], function(err, rows) {
    if (err || rows.length != 1) {
      console.log("no char found for:" + number);
      callback({});
    }
    var charData = updateTimeSensitiveData(rows[0], number);
    charData = {
      name: charData.charName,
      income: charData.charDailyIncome,
      savings: charData.charSavings,
      health: charData.charHealth,
      transportation: charData.charTransporation,
      occupation: charData.charOccupation,
      costOfLiving: charData.charCostOfLivingDaily,
      items: charData.charItems
    }
    callback(charData);
  });
}

var updateTimeSensitiveData = function(oldData, number) {
  if (oldData.timeDiff < 1) {
    // Nothing for now.
  }
  items = JSON.parse(oldData.charItems);
  for (var key in items) {
    items[key] = Math.max(items[key] - 1, 0);
  }
  var newItems = JSON.stringify(items);
  var newSavings = oldData.charSavings + 1;
  oldData.charItems = newItems;
  oldData.charSavings = newSavings;
  DATABASE.query(QUERY_UPDATE_TIME_SENSITIVE_DATA, [newSavings, newItems, number], function(err) {
    if(err) {
      console.log("error updating time sensitive info");
    }
  });
  return oldData;
}

var createUser = function(number, callback) {
  console.log("creating user:" + number);
  var message = CONVERSATION.getNextAction({}, "");
  DATABASE.query(QUERY_CREATE_USER, [number, JSON.stringify(message)], function(err) {
    if (err) {
      console.log("error:" + err);
      callback();
    } else {
      sendMessage(message.message, number);
      callback();
    }
  });
}

var sendMessage = function(message, number) {
  TWILIO.sms.messages.create({
    to: number,
    from: "5084030215",
    body: message.substring(0, 160),
  }, function(error, message) {
    console.log("err: " + JSON.stringify(error) + "   msg:" + message);
    console.log("sent message to:" + number);
  });
}

var sanitizePhoneNumber = function(num) {
  num = num.replace(/\D/g, num);
  while (num.length < 10) {
    num = num + "0";
  }
  if (num.length == 10) {
    num = "1" + num;
  }
  return num.substring(0, 11);
}
