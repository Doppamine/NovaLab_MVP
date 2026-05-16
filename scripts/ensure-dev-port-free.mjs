import net from 'node:net'

const port = Number.parseInt(process.argv[2] || '5173', 10)
const hosts = ['127.0.0.1', '::1']

function canConnect(host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port })

    socket.setTimeout(350)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

for (const host of hosts) {
  if (await canConnect(host)) {
    console.error(`Port ${port} is already in use on ${host}.`)
    console.error('Stop the old dev server first, then run `npm run dev:https` again.')
    console.error(`Find it with: lsof -nP -iTCP:${port} -sTCP:LISTEN`)
    process.exit(1)
  }
}
