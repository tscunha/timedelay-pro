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
    
    // Adding 1m and 2m delays for immediate testing
    const conf = `
TS_001_delay30m  ts_001  1800  10001
TS_001_delay60m  ts_001  3600  11001
TS_002_delay30m  ts_002  1800  10002
TS_003_delay30m  ts_003  1800  10003
TS_001_delay1m   ts_001  60    10011
TS_002_delay1m   ts_002  60    10012
`.trim() + '\n';
    
    const cmds = [
      'echo "' + conf + '" > /opt/timeshift/channels.conf',
      'bash /opt/timeshift/timeshift.sh stop',
      'bash /opt/timeshift/timeshift.sh start',
      'bash /opt/timeshift/timeshift.sh status'
    ];
    
    for (const cmd of cmds) {
      console.log('Running:', cmd);
      const result = await ssh.execCommand(cmd);
      if (result.stdout) console.log(result.stdout);
    }
    
    ssh.dispose();
    console.log('Deployment complete!');
  } catch(e) {
    console.error('Connection failed:', e);
    process.exit(1);
  }
}
run();
