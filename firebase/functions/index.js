// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion, Payload} = require('dialogflow-fulfillment');
const axios = require('axios');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  async function ShowRentals(agent) {
    const city = request.body.queryResult.parameters.city || '';

    const rentals = await callApi(city);

    if (rentals == null) {
      agent.add(`Lo siento, no he podido encontrar lugares que alquilar`);
    } else {
      agent.add(`He encontrado los siguientes alojamientos`);
      
      for (let i=0; i<3; i++) {
        const rentalEl = (rentals.length > 7)
          ? rentals[Math.floor(Math.random()*rentals.length)]
          : rentals[i];

        console.log(`Getting element`, rentalEl);

        agent.add(createVacasaCard(
          rentalEl.title,
          `https://${rentalEl.image}`,
          `Ver Información`,
          `https://www.vacasa.com/unit.php?UnitID=${rentalEl.id}`
        ));
      }
    }

    agent.setContext(handleContext('location', 5, {city}));
  }

  let intentMap = new Map();

  intentMap.set('Show Rentals', ShowRentals);
  agent.handleRequest(intentMap);
});

/** Create simple context */
function handleContext(name, lifespan, parameters) {
  return {
    name,
    lifespan,
    parameters
  };
}

/** Create a card rich message */
function createVacasaCard(title, imageUrl, buttonText, buttonUrl, text = '') {
  return new Card({
    title,
    imageUrl,
    text,
    buttonText,
    buttonUrl
  })
}

/** Call API to get data */
async function callApi(city) {
  const endpoint = `https://webscrapinginterview2.azurewebsites.net/api/vacasa?city=${city}`;
  var response = null;

  try {
    const apiResponse = await axios.get(endpoint);
    response = apiResponse.data;
    console.log('Success callApi');
  } catch (error) {
    console.error('Catch callApi ' + error);
  }

  return response;
}