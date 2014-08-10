b = [
    {
        "message": "Hey there, I'm your twinn! I work as a bricklayer and chicken farmer. I always need more feed for my chickens! Can you help me out with 75 rupesos ($3) of feed? Reply YES or NO",
        "YES": {
            "item": "CHICKEN_FEED",
            "cost": 3,
            "message": "Thanks for the feed, here are the chickens enjoying it! https://www.youtube.com/watch?v=Xc2qXY4UYEQ"
        },
        "NO": {
            "message": "Sad chickens : (http://goo.gl/Ndt9uU)" 
        }
    },
    {
        "message": "Hey there, I'm your twinn! I work as a laborer in the city. I'm tired of walking 3 hours to get there, think you can help me get a bus pass, it's just  125 rupesos ($5) more than what I have. Reply YES or NO",
        "YES": {
            item: "BUS_PASS",
            cost: 5,
            "message": "Thanks, riding the bus in style! http://goo.gl/p1BOhq" 
        },
        "NO": {
            "message": "http://goo.gl/z9Cyz6" 
        }
    },
    {
        
        "message": "Hey there! I almost have enough for a new bike. Can you help me out with the last 250 rupesos ($10)? Reply YES or NO",
        "YES": {
            "item": "BIKE",
            "cost": 10,
            "message": "Thank you, now my goats won't have to walk like common horses! http://goo.gl/kGPp5W" 
        },
        "NO": {
            "message": "http://goo.gl/JePNc6"
        }
    },
    {
       
        "message": "Hey there, it's me again! I'm tired of sleeping in the rain. Do you have 125 rupesos ($5) to help me get a tent? Reply YES or NO",
        "YES": {
             "item": "TENT",
        "cost": 5,
            "message": "Now I'm so cozy! http://goo.gl/jnHEj9" 
        },
        "NO": {
            "message": "http://goo.gl/JePNc6" 
        }
    },
    {
        
        "message": "Think I'm getting sick, but I need a few dollars to go the doctor, have $4? Reply YES or NO",
        "YES": {
            "item": "DOCTOR",
        "cost": 4,
            "message": "I can breathe free again! http://goo.gl/Zq1S8l" 
        },
        "NO": {
           
            "message": "http://goo.gl/ZEiJeZ Do you have $1 for a box of good tissues? Reply YES or NO",
            "YES": {
                 "item": "TISSUES",
            "cost": 1,
                "message": "Thank you! My nose feels royal. http://goo.gl/0HYpT8"
            },
            "NO": {
                "message": "I'm sure lower quality tissues will be fine http://goo.gl/Nw78sq" 
            }
        }
    },
    {
        
        "message": "Water supplies to my town have been cut, and they're charging $8 for a bottle of water, think you can help me out? Reply YES or NO",
        "YES": {
            "item": "WATER_BOTTLE",
        "cost": 8,
            "message": "Enjoyed every drop: http://goo.gl/0uEJko" 
        },
        "NO": {
            "message": "So thirsty. https://www.youtube.com/watch?v=T7Q31TDkln0"
        }
    },
    {
        
        "message": "My son has discovered mud and now needs a new shirt. Do you have $10 to help out? Reply YES or NO. The damage: http://4.bp.blogspot.com/_-nvvJMcG-3g/TK5xoJHhHVI/AAAAAAAAD3U/RzHz8L_axfs/s1600/DSC_6542.JPG",
        "YES": {
            "item": "SHIRT",
            "cost": 10,
            "message": "I'm sure he'll take great care of it http://goo.gl/yinvnj"  
        },
        "NO": {
            "message": "I'll ask him to take better care of it http://goo.gl/yinvnj" 
        }
    },
    {
        
        "message": "I had to leave my home behind because of the storm and I'm on the road now. Could really use a radio to hear some broadcasts, have $20 to spare? Reply YES or NO",
        "YES": {
            "item": "RADIO",
            "cost": 20,
            "message": "Thank you! Now, I can hear when it is safe to go back. I'll dance in the meantime. https://www.youtube.com/watch?v=wXQUhX89vtQ"
        },
        "NO": {
            "message": "I'll have to listen in on my bunkmate's shitty old radio : /"
        }
    },
    {
        "message": "The storm means we have to boil all the water we get in our taps. Have $15 for a water boiler? Reply YES or NO",
        "YES": {
            "item": "WATER_BOILER",
             "cost": 15,
            "message": "Clean water! Finally! http://goo.gl/BxgwPB"
        },
        "NO": {
            "message": "Perhaps you can help with some Iodine pills, they're about $6. Reply YES or NO",
            "YES": {
                "item": "PILLS",
                "cost": 6,
                "message": "Thank you! Clean water!"
            },
            "NO": {
                "message": "I'm probably better off not drinking this http://goo.gl/PqG2Kr" 
            }
        }
    }
];


var QUERY_GET_USER_STATE = "SELECT userState FROM users where phoneNumber=?";
var QUERY_SET_USER_STATE = "UPDATE users SET userState=? WHERE phoneNumber=?";


function sanitizedMessageFromUser(message) {
    message = message.toLowerCase();
    if (message == "true" || message == "yes") {
        return "YES";
    }
    return "NO";
}

/**
 *  *  previousMessageToUser {JSON} Message object used to dispatch to user
 *   *  messageFromUser {string} User's last message.
 *    */
exports.getNextAction = function getNextAction(previousMessageToUser, messageFromUser) {
    var booleanKey = sanitizedMessageFromUser(messageFromUser);
    if (previousMessageToUser[booleanKey]) {
      return previousMessageToUser[booleanKey];
    } else {
      return b[Math.floor(Math.random() * b.length)];
    }
}

