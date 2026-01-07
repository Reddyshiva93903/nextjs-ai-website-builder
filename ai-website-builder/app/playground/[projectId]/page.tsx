"use client"
import React, { useEffect, useState } from 'react'
import PlaygroundHeader from '../_components/PlaygroundHeader'
import ChatSection from '../_components/ChatSection'
import WebsiteDesign from '../_components/WebsiteDesign'
import ElementSettingSection from '../_components/ElementSettingSection'
import { useParams, useSearchParams } from 'next/navigation'
import axios from 'axios'

export type Frame = {
  projectId: string,
  frameId: string,
  designCode: string,
  chatMessages: Messages[]
}

export type Messages = {
  role: string,
  content: string
}



export default function PlayGround() {
  const { projectId } = useParams();
  const params = useSearchParams();
  const frameId = params.get('frameId');
  const [frameDetail, setFrameDetail] = useState<Frame | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  useEffect(() => {
    if (frameId) {
      GetFrameDetails();
    }
  }, [frameId])

  const GetFrameDetails = async () => {
    try {
      const result = await axios.get('/api/frames?frameId=' + frameId + "&projectId=" + projectId);
      setFrameDetail(result.data);
      setMessages(result.data?.chatMessage || []);
    } catch (error) {
      console.error("Error fetching frame details:", error);
    }
  }

  const SendMessage = async (userInput: string) => {
    setLoading(true);

    const userNewMessage = { role: 'user', content: userInput };
    setMessages((prev) => [...(prev || []), userNewMessage]);

    try {
      const result = await fetch('/api/ai-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userNewMessage]
        })
      });

      if (!result.body) return;

      const reader = result.body.getReader();
      const decoder = new TextDecoder();

      let aiResponse = '';
      let isCode = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;

        if (!isCode && aiResponse.includes('```html')) {
          isCode = true;
          const index = aiResponse.indexOf("```html") + 7;
          const initialCodeChunk = aiResponse.slice(index);
          setGeneratedCode(initialCodeChunk);
        } else if (isCode) {
          const cleanChunk = chunk.replace('```', '');
          setGeneratedCode((prev) => (prev || '') + cleanChunk);
        }
      }

      if (!isCode) {
        setMessages((prev) => [
          ...(prev || []),
          { role: 'assistant', content: aiResponse }
        ]);
      } else {
        setMessages((prev) => [
          ...(prev || []),
          { role: 'assistant', content: 'Your code is ready!' }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PlaygroundHeader />
      <div className='flex'>
        <ChatSection 
          messages={messages} 
          loading={loading} 
          onSend={(input: string) => SendMessage(input)} 
        />
        <WebsiteDesign generatedCode={generatedCode} />
      </div>
    </div>
  )
}