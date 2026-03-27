const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to VPS 72.60.142.3...');
    await ssh.connect({
      host: '72.60.142.3',
      username: 'root',
      password: 'Timbica1290.'
    });
    console.log('Connected to VPS!');
    
    // NOME STREAMID DELAY(s) PORTA
    const conf = `
TS_001_delay30m  ts_001  1800  10001
TS_001_delay60m  ts_001  3600  11001
TS_002_delay30m  ts_002  1800  10002
TS_003_delay30m  ts_003  1800  10003
`.trim() + '\n';
    
    const cmds = [
      'echo "' + conf + '" > /opt/timeshift/channels.conf',
      'bash /opt/timeshift/timeshift.sh stop',
      'bash /opt/timeshift/timeshift.sh start',
      'bash /opt/timeshift/timeshift.sh status'
    ];
    
    for (const cmd of cmds) {
      console.log('-----------------------------------');
      console.log('Running:', cmd);
      const result = await ssh.execCommand(cmd);
      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);
    }
    
    ssh.dispose();
    console.log('Deployment complete!');
  } catch(e) {
    console.error('Connection failed:', e);
    process.exit(1);
  }
}
run();
