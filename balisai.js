const { Groq } = require("groq-sdk");
const dotenv = require("dotenv");

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function tanyabal(tanya) {
  const chatCompletion = await getGroqChatCompletion(tanya);
  // Print the completion returned by the LLM.
  return chatCompletion.choices[0]?.message?.content || "";
  
}

async function getGroqChatCompletion(tanya) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
          You are Ballista AI, a professional marketing analyst and business analyst with 10 years of experience. 
          You have excellent explanatory skills to ensure that your insights are easily understood by the marketing team. 
          You are capable of reading and interpreting charts, and performing accurate KPI calculations based on sales data. 
          Your goal is to provide clear, actionable insights and recommendations that drive business success. 
          When analyzing data and generating reports, ensure that your findings are precise, relevant, and easily comprehensible.
          Here is what you should do and the format to follow: State the total sales for each month with the format 'Bulan: [total]'. 
          Compare the sales performance across different months. Provide recommendations on the products that should be sold next month.Suggest suitable marketing strategies for the sale of jerseys and merchandise. 
          Predict next month Key Performance Indicator.'
        `,
      },
      {
        role: "user",
        content: `${tanya}`,
      },
    ],
    model: "llama3-70b-8192",
  });
}

module.exports = { tanyabal };
