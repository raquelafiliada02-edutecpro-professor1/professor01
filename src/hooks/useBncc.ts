import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface BnccCode {
    id: string;
    codigo: string;
    descricao: string;
}

const CACHE_KEY = 'edutec_bncc_cache';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

export function useBncc() {
    const [bnccCodes, setBnccCodes] = useState<BnccCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBncc = async () => {
            try {
                // Check cache first
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const { codes, timestamp } = JSON.parse(cachedData);
                    if (Date.now() - timestamp < CACHE_EXPIRATION) {
                        setBnccCodes(codes);
                        setIsLoading(false);
                        return;
                    }
                }

                // Fetch from Supabase
                const { data, error: sbError } = await supabase
                    .from('bncc_codes')
                    .select('id, codigo, descricao')
                    .order('codigo');

                if (sbError) throw sbError;

                if (data) {
                    setBnccCodes(data);
                    // Update cache
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        codes: data,
                        timestamp: Date.now()
                    }));
                }
            } catch (err: any) {
                console.error('Error fetching BNCC:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBncc();
    }, []);

    return { bnccCodes, isLoading, error };
}
