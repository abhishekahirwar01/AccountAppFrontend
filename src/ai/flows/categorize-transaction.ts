
'use server';

/**
 * @fileOverview An AI agent that suggests general ledger categories for financial transactions based on their descriptions.
 *
 * - categorizeTransaction - A function that handles the transaction categorization process.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  description: z.string().describe('The description of the financial transaction.'),
});
export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  suggestedCategory: z.string().describe('The suggested general ledger category for the transaction.'),
  confidenceScore: z.number().describe('A score between 0 and 1 indicating the confidence level of the suggested category.'),
});
export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(input: CategorizeTransactionInput): Promise<CategorizeTransactionOutput> {
  console.log('Using dummy data for transaction categorization', input);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
      suggestedCategory: "Software",
      confidenceScore: 0.85
  };
}
