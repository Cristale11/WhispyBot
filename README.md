# WhispyBot

Bot de Discord para enviar **mensajes anónimos**, tanto en un canal del servidor como **por mensaje privado** a un usuario concreto o a uno al azar. Quien lo recibe puede responder de forma anónima, y se forma una conversación en la que ninguno de los dos sabe quién es el otro.

Hecho con **Node.js** y **discord.js v14**.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `/annonmsg message:` | Publica un mensaje anónimo en el canal actual. Cualquiera puede pulsar **Reply** para contestar, también de forma anónima. |
| `/annondm user: message:` | Envía un mensaje anónimo por privado a un usuario. No te lo puedes mandar a ti mismo ni a un bot. |
| `/randomdm message:` | Envía un mensaje anónimo por privado a un **miembro aleatorio** del servidor que tenga los privados abiertos. |

El remitente siempre recibe la confirmación de forma efímera: solo la ve él.

---

## Cómo funciona

### Conversaciones anónimas por privado

1. Al usar `/annondm` o `/randomdm`, el bot crea un **ID de conversación** y le envía al destinatario un embed con dos botones: **💬 Reply** y **🗑️ Delete**.
2. **Reply** abre un formulario (modal) de Discord. La respuesta le llega al otro usuario, también por privado y también sin nombre, y él puede volver a responder. Así se encadena la conversación en las dos direcciones.
3. Cada participante tiene un **color de embed distinto** dentro de la conversación, para distinguir quién habla sin saber quién es.
4. El mensaje nuevo muestra el texto al que se está respondiendo, y hay **botones de navegación ◀ ▶** para moverse por el historial.
5. **Delete** borra la conversación del lado de quien lo pulsa.

El título del embed indica si el mensaje viene de un `/annondm` dirigido o de un `/randomdm` aleatorio.

### Mensajes anónimos en canal

`/annonmsg` publica el embed en el canal con un botón **Reply**. Las respuestas también se publican de forma anónima.

### Persistencia

El historial de conversaciones se guarda en `data/conversation-history.json`. Así, si el bot se cae o se reinicia, los botones de las conversaciones abiertas siguen funcionando.

### Robustez

- Gestiona los errores típicos de Discord: falta de permisos (`50013`), interacciones caducadas (`10062`) o usuarios con los privados cerrados.
- Captura los `unhandledRejection` y `uncaughtException` para que un error suelto no tire el bot.

> ℹ️ El anonimato es entre usuarios. El bot registra en consola quién envía cada mensaje, para poder moderar abusos.

---

## Estructura

```
index.js                  # arranque, slash commands y enrutado de interacciones
deploy-commands.js        # registra los comandos en Discord
config/client.js          # cliente de discord.js con sus intents
handlers/
├── button-handler.js     # Reply, Delete y navegación ◀ ▶
└── modal-handler.js      # envío de respuestas desde el formulario
utils/
├── embed-builder.js      # diseño de los embeds
├── conversation-history.js # historial de conversaciones + guardado en JSON
├── message-storage.js    # quién envió cada mensaje anónimo
├── user-colors.js        # color por participante y conversación
└── button-helpers.js     # construcción de filas de botones
```

---

## Instalación

Requisitos: Node.js 18 o superior y una aplicación de bot creada en el [Discord Developer Portal](https://discord.com/developers/applications).

1. En el portal, pestaña **Bot**, activa los intents **Server Members** y **Message Content** (el bot los usa para `/randomdm`).
2. Clona el repo e instala las dependencias:

```bash
git clone https://github.com/Cristale11/WhispyBot.git
cd WhispyBot
npm install
```

3. Copia `.env.example` a `.env` y rellénalo:

```env
TOKEN=token_del_bot
CLIENT_ID=id_de_la_aplicacion
GUILD_ID=id_de_tu_servidor
```

4. Registra los slash commands (solo la primera vez o cuando los cambies) y arranca el bot:

```bash
node deploy-commands.js
node index.js
```

5. Invita el bot a tu servidor con los scopes `bot` y `applications.commands` y permiso para enviar mensajes.

> ⚠️ Nunca subas el `.env` al repositorio: el token da control total del bot.
