import { consultar, obtenerPool } from './src/config/db.js';
const procesos = await consultar('SHOW PROCESSLIST');
for (const p of procesos) {
  if ((p.Command || '').toLowerCase() !== 'sleep' || (p.Info && p.Info.trim())) {
    console.log(`id=${p.Id} user=${p.User} db=${p.db} cmd=${p.Command} time=${p.Time} info=${(p.Info || '').slice(0, 80)}`);
  }
}
console.log('Total conexiones:', procesos.length);
await obtenerPool().end();
