import { useApi } from "~/composables/useApi"

const paymentService = {
    initiateStk(payload: Record<string, any>) {
        const config = useRuntimeConfig();
        const useMockPayments = Boolean(config.public.useMockPayments);

        if (useMockPayments) {
            // Simulate a successful STK push without hitting the gateway.
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        message: 'Mock STK push initiated',
                        saf_res: {
                            CheckoutRequestID: `MOCK-${Date.now()}`
                        }
                    });
                }, 500);
            });
        }

        return useApi('/payments/mpesa/initiate_stk/', {
            handler: '$fetch',
            method: 'POST',
            body: payload
        });
    },
    verifyMpesaPayment(mpesa_receipt_number: string) {
        return useApi('/payments/mpesa/verify_receipt_number/', {
            handler: '$fetch',
            method: 'POST',
            body: { mpesa_receipt_number: mpesa_receipt_number }
        });
    },
    stkQuery(checkout_request_id: string) {
        return useApi('/payments/mpesa/query_stk/', {
            handler: '$fetch',
            method: 'POST',
            body: { checkout_request_id: checkout_request_id }
        });
    },
    addPayPalPayment(payload: Record<string, any>) {
        const config = useRuntimeConfig();
        const useMockPayments = Boolean(config.public.useMockPayments);

        if (useMockPayments) {
            // Simulate a successful PayPal capture + backend record.
            return Promise.resolve({
                id: `MOCK-PAYPAL-${Date.now()}`
            } as any);
        }

        return useApi('/payments/paypal/', {
            handler: '$fetch',
            method: 'POST',
            body: payload
        });
    },
    checkPayment(payload: Record<string, any>) {
        const config = useRuntimeConfig();
        const useMockPayments = Boolean(config.public.useMockPayments);

        if (useMockPayments) {
            // Pretend that the payment has been confirmed.
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true
                    });
                }, 1500);
            });
        }

        return useApi('/payments/mpesa/check_payment/', {
            handler: '$fetch',
            method: 'POST',
            body: payload
        });
    },
    listEmployerPaymentMethods() {
        return useApi('/payments/employer-payment-methods/', {
            handler: '$fetch',
            method: 'GET',
        });
    },
    createEmployerPaymentMethod(payload: Record<string, any>) {
        return useApi('/payments/employer-payment-methods/', {
            handler: '$fetch',
            method: 'POST',
            body: payload
        });
    },
    setDefaultEmployerPaymentMethod(id: string) {
        return useApi(`/payments/employer-payment-methods/${id}/set-default/`, {
            handler: '$fetch',
            method: 'POST',
        });
    },
    deleteEmployerPaymentMethod(id: string) {
        return useApi(`/payments/employer-payment-methods/${id}/`, {
            handler: '$fetch',
            method: 'DELETE',
        });
    }
};

export { paymentService };
