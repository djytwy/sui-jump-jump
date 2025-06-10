"use server"

import { kv } from '@vercel/kv'

export const addKey = async (k: string, v: string) => {    
    const n = await kv.set(k,v)
}
