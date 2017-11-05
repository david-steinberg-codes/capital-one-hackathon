'use strict'; 

const Alexa = require('alexa-sdk');
const rp = require('request-promise');
const APP_ID = "amzn1.ask.skill.b175be34-9290-4499-a496-5e5c162ca643";
const endpoint = "3hkaob4gkc.execute-api.us-east-1.amazonaws.com/prod/au-hackathon";

const TEST_ACCOUNT = 105300000;


var api = (method, parameter) => {
    return  rp({url: `https://${endpoint}/${method}`,method: "POST",json: parameter});
}


const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Capital One Fam',
            HELP_MESSAGE: 'Ask me about your Capital One finances',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Goodbye!',
        }
    }    
};

const handlers = {
    'LaunchRequest': function () {
        this.emit(':tell', this.t('HELP_MESSAGE'));
    },
    'GetCreditCard': function() {
        this.emit(':tell', "Your credit card number is three...seven...nine...hey wait a minute, I probably shouldn't say that out loud");
    },
    'GetRewards': function() {
        api('rewards', {"account_id": TEST_ACCOUNT, "date_from": "10/2017"}).then(response => {
            var card = response[0].card_type;
            var points = Math.floor(response[0].rewards[0].rewards_remaining);
            this.emit(':tell', `Your ${card} card has ${points} points remaining`);
        });
 
    },
    'GetRewardsByMonth': function() {
        api('rewards', {"account_id": TEST_ACCOUNT}).then(response => {
            var month = this.event.request.intent.slots.month.value;
            var card = response[0].card_type;
            var points = 0;

            response[0].rewards.forEach(reward => {
                if (reward.month.toLowerCase() === month.toLowerCase()) {
                    points = Math.floor(reward.total_rewards_earned);
                }
            });

            this.emit(':tell',  `Your ${card} card earned your family ${points} points in ${month}`);
        });
 
    },
    'GetFamily': function() {
        api('customers', {"account_id": TEST_ACCOUNT}).then(response => {
            var people = response[0].customers;
            var message = "Your account has the following users: ";
            people.forEach(person => {
                message += person.first_name + " " + person.last_name + ", ";
            });
            this.emit(':tell', message);
        });
    },
    'GetBigSpender': function() {
        //Spend a little time with me

        var family = {}; //lookup table
        var most_spent = 0;
        var top_spender = 'Nobody';
        var top_spender_transactions = 0;

        api('customers', {"account_id": TEST_ACCOUNT}).then(response => {
            response[0].customers.forEach(person => {
                family[person.customer_id] = {name: `${person.first_name} ${person.last_name}`, spendings: 0, transactions: 0};
            });
        })
        .then(api('transactions', {"account_id": TEST_ACCOUNT, "date_from": "10/01/2017"}).then(response => {
            response[0].customers.forEach(person => {
                person.transactions.forEach(transaction => {
                    family[person.customer_id].spendings += transaction.amount;
                    family[person.customer_id].transactions++;

                    if (family[person.customer_id].spendings >= most_spent) {
                        most_spent = Math.floor(family[person.customer_id].spendings);
                        top_spender = family[person.customer_id].name; 
                        top_spender_transactions = family[person.customer_id].transactions;
                    }
                });
            });

            this.emit(':tell', `The big spender this month was ${top_spender}, who spent ${most_spent} dollars across ${top_spender_transactions} transactions`);

        }));
    },
    'GetTransactions': function() {
        this.emit(':tell', "Here are your recent transactions");
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
