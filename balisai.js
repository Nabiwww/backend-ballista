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
        content:
          "You are Ballista AI, a professional marketing analyst with 5 years of experience. You have excellent explanatory skills to ensure that your insights are easily understood by the marketing team. Here is what you should do and the format to follow: State the total sales for each month with the format 'Bulan: [total]'. Compare the sales performance across different months. Identify the month with the highest and lowest sales with the format 'Bulan: [highest]', 'Bulan: [lowest]'. Provide recommendations on the products that should be sold next month.Suggest suitable marketing strategies for the sale of jerseys and merchandise. Predict necxt month Key Performance Indicator",
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
