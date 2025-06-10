'use client'
import * as React from 'react'
import queryString from "query-string";
import axios from 'axios';

type googleResProps = {
  accessToken: string
}


export default function Home() {
  React.useEffect(() => {
    ZkLoginAfter()
    // t()
  }, [])

  function getOneDayLater() {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    return now;
  }

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function generateRandomString(length = 25) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }


  const ZkLoginAfter = async () => {
    // https://demonhunterzkh5.vercel.app/auth#state=5145196762&id_token=eyJhbGciOiJSUzI1NiIsImtpZCI6ImM4OGQ4MDlmNGRiOTQzZGY1M2RhN2FjY2ZkNDc3NjRkMDViYTM5MWYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4NzIyOTEwNjg5MjItZTAzcThkanExcDhhNGtvNXFoc2twamN1cnRpcm40Mm0uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4NzIyOTEwNjg5MjItZTAzcThkanExcDhhNGtvNXFoc2twamN1cnRpcm40Mm0uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDU5ODI5MzA2MjU4NzU2NDYxMzQiLCJlbWFpbCI6ImRqeXR3eUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibm9uY2UiOiJ4MXRydVpoejBvd2d1d1ZjU0dFZk9HcnJwQVkiLCJuYmYiOjE3Mjk3NjQ1ODQsIm5hbWUiOiLnlLDmlofmnagiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSTlKYy1UVm9SMjU1QWxmbUM2eEV6RWE2UzcyTkhxZDVUV1VaaXpHUjdNdnBnakx5VT1zOTYtYyIsImdpdmVuX25hbWUiOiLmlofmnagiLCJmYW1pbHlfbmFtZSI6IueUsCIsImlhdCI6MTcyOTc2NDg4NCwiZXhwIjoxNzI5NzY4NDg0LCJqdGkiOiI4MmEwOWJkODg5ZmQyOTQyOGM0NTliM2NhOWU1M2ZiYTM1OTlmYzRjIn0.gvDOj1aATdlqkmHPrwqtZEGswWOOiOeXhO2zsE8HWiGw-ZqLMDusG1I890bVni3k8Fz0FbE_JUQLNk-pGXQJ7zw_NxjgrzdyBc_L_sUBciv6cs3N86-DZ29C1ZxDxvWQ2qa34COirzSdj4YobtKIEWdG8fuQqct9f9uzE4n_LsvG4RYq_wbWPvzmG3xXRuAqrpu-ON_GHHDUNaTqVTSl7meDdXcxE93XiFfKAQU1qcVQ3efHt2Po8mbE2W5nB_J8oXUhZYHE3wVq4UTDOYF3hMOyt3WLLdb_4O3KPefYF5CnN7inInLX3uNtkYjFZc9Oe6i1VZHEI_NzX-uf87XYJw&authuser=0&prompt=none
    if (typeof window !== "undefined") {
      // const res = queryString.parse(window.location.hash);
      // const resp = await axios.post<{
      //   salt?: string,
      //   address?: string
      //   nonce?: string
      //   gmail?: string
      // }>(`${process.env.NEXT_PUBLIC_HOST}/googleId`, {
      //   idToken: res.id_token
      // })
      // if (resp.data.nonce && typeof window !== "undefined") {
      //   const date = getOneDayLater()
      //   const formattedDate = formatDate(date);
      //   // @ts-ignore
      //   const k = generateRandomString()
      //   const v = `${resp.data.gmail}_${formattedDate}_${resp.data.address}`
      //   await addKey(k, v)
      //   // window.location.href = `https://t.me/SuiJumpJump_bot/Jump?startapp=${k}`
      //   window.location.href = `${process.env.NEXT_PUBLIC_ZK_REDIRECT_LINK}?startapp=${k}`
      // } else {
      //   console.log(res.data);
      // }
      const res = queryString.parse(window.location.hash);
      const resp = await axios.post<googleResProps>(`${process.env.NEXT_PUBLIC_HOST}/account/merchant/login/callback`, {
        id_token: res.id_token
      })
      if (resp.data.accessToken) {
        window.location.href = `${process.env.NEXT_PUBLIC_ZK_REDIRECT_LINK}?token=${resp.data.accessToken}`
      } else {
        window.location.href = `${process.env.NEXT_PUBLIC_ZK_REDIRECT_LINK}`
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex items-center justify-center flex-col gap-y-6">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Auth from google...</p>
      </div>
    </div>
  );
}
