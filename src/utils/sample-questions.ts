
/**
 * Sample questions for the chatbot
 */
export const sampleQuestions = [
  "What was the total revenue for Technology companies in Q1 2022?",
  "Show me the top 5 companies by revenue across all sectors.",
  "Which business sector had the highest profit margin in Q1 2022?",
  "Compare the revenue growth between Technology and Transportation sectors in 2022.",
  "What is the quarterly trend in profit margins for Xerox Emirates?",
  "Which region generated the most revenue for Technology companies in Q1 2022?",
  "Show me the revenue distribution by region for AVIS UAE.",
  "Compare the transaction volumes in Dubai versus Abu Dhabi for all companies.",
  "Which company had the highest market share in Fujairah?",
  "What percentage of Alomotech's revenue came from Ajman in Q1 2022?",
  "What are the most common payment methods used for transactions over $300,000?",
  "Analyze the transaction types for Xerox Emirates by volume and value.",
  "Show me the monthly transaction trend for RICOH UAE in Q1 2022.",
  "Which customer spent the most with Technology companies in Q1 2022?",
  "Compare the average transaction amounts across different business sectors.",
  "Which company had the highest customer satisfaction score and how did it affect their revenue?",
  "Show me the correlation between digital transformation index and profit margins.",
  "Rank the companies by their innovation index and analyze its impact on growth.",
  "Which company demonstrated the best sustainability score and how did it perform financially?",
  "What is the relationship between employee count and revenue across different sectors?",
  "Identify any anomalies in the transaction patterns for Corporate Connection in Q1 2022.",
  "Predict the revenue trend for Xerox Emirates based on historical data.",
  "Which factors contributed most significantly to AVIS UAE's performance in Q1 2022?",
  "Analyze the impact of digital transformation on profit margins across all sectors.",
  "Generate a risk assessment for companies with declining year-over-year growth."
];

/**
 * Get n random unique questions from the sample questions list
 */
export function getRandomQuestions(count: number = 3): string[] {
  // Make a copy of the array to avoid modifying the original
  const availableQuestions = [...sampleQuestions];
  const selectedQuestions: string[] = [];
  
  // Get 'count' random questions
  for (let i = 0; i < count && availableQuestions.length > 0; i++) {
    // Get random index
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    
    // Add question to selected questions and remove from available
    selectedQuestions.push(availableQuestions[randomIndex]);
    availableQuestions.splice(randomIndex, 1);
  }
  
  return selectedQuestions;
}
