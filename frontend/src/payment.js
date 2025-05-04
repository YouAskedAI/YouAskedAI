import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function createSubscription(email, paymentMethod) {
  try {
    const stripe = await stripePromise;
    
    // Create the subscription
    const { subscription, error } = await stripe.createSubscription({
      customer: email,
      items: [{ price: import.meta.env.VITE_STRIPE_PRICE_ID }],
      payment_method: paymentMethod,
      expand: ['latest_invoice.payment_intent'],
    });

    if (error) {
      throw error;
    }

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId) {
  try {
    const stripe = await stripePromise;
    const subscription = await stripe.subscriptions.del(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function getSubscriptionStatus(subscriptionId) {
  try {
    const stripe = await stripePromise;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.status;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
} 