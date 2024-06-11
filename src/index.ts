// Redis in NodeJS https://redis.io/docs/latest/develop/connect/clients/nodejs/
import { createClient } from "redis"
import readline from 'readline'

type CommandHandler = (args: string[]) => Promise<void>

const client = createClient({
  password: 'Lx23zWANvi5Wwu78bXkVdoxn3OKBkHFB',
  socket: {
      host: 'redis-15513.c57.us-east-1-4.ec2.redns.redis-cloud.com',
      port: 15513
  }
})

client.on('error', (err: unknown) => console.log('Redis Client Error', err))

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
})

async function addContact(name: string, email: string, phone: string) {
  await client.hSet(name, {
    email: email,
    phone: phone
  })
  console.log(`${name} foi salvo na lista de contatos.`)
}

async function listContacts() {
  try {
    const keys = await client.keys('*')
    if (keys.length === 0) {
      console.log('Nenhum contato encontrado.')
      return
    }
    console.log('Lista de Contatos:')
    console.log('=================')
    for (const key of keys) {
      const value = await client.hGetAll(key)
      console.log(`Nome: ${key}`)
      console.log(`Email: ${value.email}`)
      console.log(`Telefone: ${value.phone}`)
      console.log('-----------------')
    }
  } catch (err) {
    console.error('Erro ao listar contatos:', err)
  }
}

async function updateContact(id: string, email: string, phone: string): Promise<void> {
  if(!(await client.exists(id))) return console.log(`Nenhum contato encontrado com o nome de '${id}'`)
      
  await addContact(id, email, phone)
}

async function removeContact(id: string): Promise<void> {
  if (!await client.exists(id)) return console.log(`Nenhum contato encontrado com o nome de '${id}'`)
    
  await client.del(id)
  console.log(`Contato '${id}' foi deletado.`)
}

async function renameContact(id: string, newId: string): Promise<void> {
  if(!await client.exists(id)) return console.log(`Nenhum contato encontrado com o nome de '${id}'`)
  
  await client.hSet(newId, await client.hGetAll(id))
  await client.del(id)
  console.log(`Contato renomeado de '${id}' para '${newId}.'`)
}
async function processCommand(line: string) {
  const args: string[] = line.trim().split(' ')
  const command: string = args[0]

  const commands: Record<string, CommandHandler> = {
    'add': async (args: string[]) => {
      if (args.length !== 4) return console.log('Comando inválido. Uso: add <nome> <email> <phone>')
      const [_, id, description, date] = args
      await addContact(id, description, date)
    },
    'att': async (args: string[]) => {
      if (args.length !== 4) return console.log('Comando inválido. Uso: att <nome> <email> <phone>')
      const [_, id, description, date] = args
      await updateContact(id, description, date)  
    },
    'l': async () => {
      await listContacts()
    },
    'del': async (args: string[]) => {
      if (args.length !== 2) return console.log('Comando inválido. Uso: r <nome>')
      const [_, id] = args
      await removeContact(id)  
    },
    'rename': async (args: string[]) => {
      if(args.length !== 3) return console.log('Comando inválido. Uso: rename <nome_antigo> <nome_novo>')
      const [_, id, newId] = args
      await renameContact(id, newId)  
    },
    'h': async () => printHelp(),
    '*': async () => {
      rl.close()
      await client.quit()
    }
  }

  if (commands[command]) await commands[command](args)
  else {
    console.log('Comando inválido ou argumentos.')
    printHelp()
  }
  
  rl.prompt()
}

function printHelp() {
  console.log('Comandos disponíveis:')
  console.log('add | att <nome> <email> <phone> - Adiciona / Atualiza um contato.')
  console.log('l                                - Lista todos os contatos.')
  console.log('del <nome>                       - Deleta um contato.')
  console.log('rename <atingo_nome> <novo_nome> - Renomeia um contato.')
  console.log('h                                - Mostra esta mensagem de ajuda.')
  console.log('*                                - Encerra o programa.')
}

async function main (){
  await client.connect() 
  
  console.log(`Digite 'h' para ver a ajuda.`)
  rl.prompt()
  rl.on('line', processCommand)
  rl.on('close', async () => {
    console.log('Saindo...')
    process.exit(0)
  })
}
await main()