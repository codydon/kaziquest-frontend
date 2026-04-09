import { useApi } from "~/composables/useApi"
import type { UseApiOptions } from "~/composables/useApi"
import { asCollectionOptions, asResourceOptions } from "./service-options"

export const walletService = {
    getCompanyWallet,
    deposit,
    getWalletTransactions,
    pay,
    initiatePayment,
    getPayslipsWithTransactions,
    continuePayment,
    requestWithdrawal
}

function requestWithdrawal(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payments/wallets/request-withdrawal/',
        asCollectionOptions(options, {
            method: 'POST',
        }))
}

function continuePayment(transactionId: string){
    return useApi('/payments/wallets/payout/',
        {
            method: 'POST',
            body: {
                transaction_id: transactionId
            }
        })
}

function getPayslipsWithTransactions(payrollId: string){
    return useApi(`/payroll/payslips/with-transactions?payroll_id=${payrollId}`,
        {
            method: 'GET',
        })
}

function initiatePayment(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payments/wallet-transactions/initiate-transaction/', {
        ...asCollectionOptions(options, {
            method: 'POST',
        }),
    })
}

function getCompanyWallet() {
    return useApi('/payments/wallets/',
        {
        }
    )
}

function deposit(walletId: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi(`/payments/wallets/${walletId}/topup/`, {
        ...asResourceOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}

function getWalletTransactions(){
    return useApi('/payments/wallet-transactions',
        {
        })
}

function pay(walletId: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi(`/payments/wallets/${walletId}/pay/`, {
        ...asResourceOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}
