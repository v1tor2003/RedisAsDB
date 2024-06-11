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

/**
 * Adds a contact to the contact list.
 * 
 * @param {string} name - The name of the contact.
 * @param {string} email - The email address of the contact.
 * @param {string} phone - The phone number of the contact.
 * @returns {Promise<void>} A promise that resolves when the contact has been added.
 */
async function addContact(name: string, email: string, phone: string) {
  await client.hSet(name, {
    email: email,
    phone: phone
  })
  console.log(`${name} foi salvo na lista de contatos.`)
}
/**
 * Lists all contacts stored in the contact list.
 * 
 * @returns {Promise<void>} A promise that resolves when the contact list has been retrieved and logged.
 */
async function listContacts(): Promise<void> {
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
/**
 * Updates an existing contact's email and phone information.
 * 
 * @param {string} id - The unique identifier of the contact.
 * @param {string} email - The new email address of the contact.
 * @param {string} phone - The new phone number of the contact.
 * @returns {Promise<void>} A promise that resolves when the contact has been updated.
 */
async function updateContact(id: string, email: string, phone: string): Promise<void> {
  if(!(await client.exists(id))) return console.log(`Nenhum contato encontrado com o nome de '${id}'`)
      
  await addContact(id, email, phone)
}
/**
 * Removes a contact from the contact list.
 * 
 * @param {string} id - The unique identifier of the contact to be removed.
 * @returns {Promise<void>} A promise that resolves when the contact has been removed.
 */
async function removeContact(id: string): Promise<void> {
  if (!await client.exists(id)) return console.log(`Nenhum contato encontrado com o nome de '${id}'`)
    
  await client.del(id)
  console.log(`Contato '${id}' foi deletado.`)
}

/**
 * Renames an existing contact by changing its unique identifier.
 * 
 * @param {string} id - The current unique identifier of the contact.
 * @param {string} newId - The new unique identifier for the contact.
 * @returns {Promise<void>} A promise that resolves when the contact has been renamed.
 */
async function renameContact(id: string, newId: string): Promise<void> {
  if(!await client.exists(id)) return console.log(`Nenhum contato encontrado com o nome de '${id}'`)
  
  await client.hSet(newId, await client.hGetAll(id))
  await client.del(id)
  console.log(`Contato renomeado de '${id}' para '${newId}.'`)
}

/**
 * Processes a command line input and executes the corresponding contact management command.
 * 
 * @param {string} line - The command line input.
 * @returns {Promise<void>} A promise that resolves when the command has been processed.
 */
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

/**
 * Prints the help message with a list of available commands and their usage.
 * @returns {void}
 */
function printHelp(): void {
  console.log('Comandos disponíveis:')
  console.log('add | att <nome> <email> <phone> - Adiciona / Atualiza um contato.')
  console.log('l                                - Lista todos os contatos.')
  console.log('del <nome>                       - Deleta um contato.')
  console.log('rename <atingo_nome> <novo_nome> - Renomeia um contato.')
  console.log('h                                - Mostra esta mensagem de ajuda.')
  console.log('*                                - Encerra o programa.')
}

/**
 * program's execution entry point
 * @returns {Promise<void>}
 */
async function main (): Promise<void>{
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