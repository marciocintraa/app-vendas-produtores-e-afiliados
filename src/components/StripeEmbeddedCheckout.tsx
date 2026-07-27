import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import { startCheckout } from '@/lib/checkout.functions';

interface Props {
  priceId: string;
  email: string;
  returnUrl: string;
}

export function StripeEmbeddedCheckoutForm({ priceId, email, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await startCheckout({
      data: { priceId, email, returnUrl, environment: getStripeEnvironment() },
    });
    if ('error' in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error('Não foi possível iniciar o checkout');
    return result.clientSecret;
  };
  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
