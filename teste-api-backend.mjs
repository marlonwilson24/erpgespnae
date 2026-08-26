import municipiosHandler from './api/municipios.ts';
import adminUsuariosHandler from './api/admin-usuarios.ts';
import { config } from 'dotenv';

config();

console.log('--- TESTANDO API HANDLERS DO BACKEND ---');

// Mock req e res para testar os handlers em isolamento
function criarMockReqRes(method, body = {}, headers = {}, query = {}) {
  let statusCode = 200;
  let jsonOutput = null;

  const req = {
    method,
    body,
    headers,
    query,
  };

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      jsonOutput = data;
      return res;
    },
  };

  return { req, res, getResult: () => ({ status: statusCode, body: jsonOutput }) };
}

async function testar() {
  console.log('\n1. Executando handler de Municipios (GET sem token)...');
  const t1 = criarMockReqRes('GET');
  await municipiosHandler(t1.req, t1.res);
  console.log('Resultado:', t1.getResult());

  console.log('\n2. Executando handler de Usuarios Admin (GET sem token)...');
  const t2 = criarMockReqRes('GET');
  await adminUsuariosHandler(t2.req, t2.res);
  console.log('Resultado:', t2.getResult());
}

testar().catch(console.error);
