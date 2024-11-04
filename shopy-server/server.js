require('dotenv').config();
const express = require("express");
const app = express();
app.use(express.json());

const stripe = require('stripe')(process.env.SECRET_KEY);

app.post('/payment-sheet', async (req, res) => {
  try {
    const {
      customerId, name, email, street, city, region, zipcode, country, amount,
    } = req.body;

    const customer = customerId
      ? await stripe.customers.retrieve(customerId)
      : await stripe.customers.create({
          metadata: {
            customerId: customerId,
            name: name,
            email: email,
            street: street,
            region: region,
            city: city,
            zipcode: zipcode,
            country: country,
          },
        });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-10-28.acacia' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.PUBLISHABLE_KEY,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`));