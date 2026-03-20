import { initTsrReactQuery } from '@ts-rest/react-query/v5'
import { apiContract } from './contract/index'

export const tsr = initTsrReactQuery(apiContract, {
  baseUrl: 'https://portier-takehometest.onrender.com',
})

export type ApiClient = typeof tsr