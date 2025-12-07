#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

async function listModels() {
  const genAI = new GoogleGenerativeAI(API_KEY);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    const data = await response.json();

    console.log("Available Gemini Models:");
    console.log("=======================\n");

    if (data.models) {
      data.models.forEach((model: any) => {
        console.log(`Name: ${model.name}`);
        console.log(`Display Name: ${model.displayName}`);
        console.log(`Description: ${model.description}`);
        console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
