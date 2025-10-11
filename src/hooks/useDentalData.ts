import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToothCondition, Finding } from '@/types/dental';

export interface Patient {
  id: string;
  name: string;
  date_of_birth?: string;
  created_at: string;
}

export interface DentalSession {
  id: string;
  patient_id: string;
  session_data: {
    teethStatus: [number, ToothCondition][];
    findings: Finding[];
  };
  created_at: string;
}

export const useDentalData = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPatient = async (name: string, dateOfBirth?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name,
          date_of_birth: dateOfBirth
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating patient',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (
    patientId: string,
    teethStatus: Map<number, ToothCondition>,
    findings: Finding[]
  ) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sessionData = {
        teethStatus: Array.from(teethStatus.entries()),
        findings: findings.map(f => ({
          id: f.id,
          toothNumber: f.toothNumber,
          condition: f.condition,
          timestamp: f.timestamp,
          notes: f.notes || undefined
        }))
      };

      const { error } = await supabase
        .from('dental_sessions')
        .insert([{
          patient_id: patientId,
          user_id: user.id,
          session_data: sessionData as any
        }]);

      if (error) throw error;

      toast({
        title: 'Session saved',
        description: 'Dental session saved successfully'
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error saving session',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Error loading patients',
        description: error.message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPatientSessions = async (patientId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dental_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Error loading sessions',
        description: error.message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveFailedRecording = async (audioData: string, mimeType: string, duration: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audio_recordings')
        .insert({
          user_id: user.id,
          audio_data: audioData,
          mime_type: mimeType,
          duration,
          status: 'failed'
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error saving failed recording:', error);
      return false;
    }
  };

  const getFailedRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_recordings')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error loading failed recordings:', error);
      return [];
    }
  };

  return {
    loading,
    createPatient,
    saveSession,
    getPatients,
    getPatientSessions,
    saveFailedRecording,
    getFailedRecordings
  };
};