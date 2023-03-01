import { OpenAIStream, OpenAIStreamPayload } from "utils/OpenAIStream";

import { FileChunk } from "../../types/file";

export const config = {
  runtime: "experimental-edge",
};

const MAX_FILES_LENGTH = 2000 * 3;

const handler = async (req: Request): Promise<Response> => {
  // Only accept POST requests

  const { fileChunks , question  } = (await req.json()) as {
    fileChunks?: FileChunk[];
    question?: string;

  };

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!Array.isArray(fileChunks)) {
    return new Response("fileChunks must be an array", { status: 400 });
  }

  if (!question) {
    return new Response("question must be a string", { status: 400 });
  }
    const filesString = fileChunks
      .map((fileChunk) => `###\n\"${fileChunk.filename}\"\n${fileChunk.text}`)
      .join("\n")
      .slice(0, MAX_FILES_LENGTH);

    console.log(filesString);

    const prompt =
      `Given a question, try to answer it using the content of the file extracts below, and if you cannot answer, or find a relevant file, just output \"I couldn't find the answer to that question in your files.\".\n\n` +
      `If the answer is not contained in the files or if there are no file extracts, respond with \"I couldn't find the answer to that question in your files.\" If the question is not actually a question, respond with \"That's not a valid question.\"\n\n` +
      `In the cases where you can find the answer, first give the answer. Then explain how you found the answer from the source or sources, and use the exact filenames of the source files you mention. Do not make up the names of any other files other than those mentioned in the files context. Give the answer in markdown format.` +
      `Use the following format:\n\nQuestion: <question>\n\nFiles:\n<###\n\"filename 1\"\nfile text>\n<###\n\"filename 2\"\nfile text>...\n\nAnswer: <answer or "I couldn't find the answer to that question in your files" or "That's not a valid question.">\n\n` +
      `Question: ${question}\n\n` +
      `Files:\n${filesString}\n\n` +
      `Answer:`;

    const payload: OpenAIStreamPayload = {
      model: "text-davinci-003",
      prompt,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 200,
      stream: true,
      n: 1,
    };
  
    const stream = await OpenAIStream(payload);
    return new Response(stream);

}
  
 export default handler