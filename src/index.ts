import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vehicleRoutes from './routes/vehicleRoutes';
import adminRoutes from './routes/adminRoutes';

import { supabase } from './utils/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log global para ver TODAS las peticiones que llegan al servidor
app.use((req, res, next) => {
  console.log(`[Global Log] ${req.method} ${req.url}`);
  next();
});

app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);

// PRUEBA CREATIVA DIRECTA
app.get('/api/test-directo', async (req, res) => {
  try {
    const { data, error } = await supabase.from('workshop_settings').select('*');
    if (error) throw error;
    res.json({ status: "Conectado a Supabase", data });
  } catch (err: any) {
    res.status(500).json({ status: "Error de conexión", error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Workshop Management API is running');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
