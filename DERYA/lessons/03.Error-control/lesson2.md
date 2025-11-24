# Lección 2: Manejo de Errores Asíncronos - Paciencia con el Destino Demorado

**Minicurso**: Manejo de Errores (Naranja - Superando el Miedo)
**Lección**: 2 de 3
**Duración**: 35 minutos
**Tema Estoico**: Premeditatio Malorum - Prepararse para adversidad futura

---

## 🎯 Objetivos de Aprendizaje

Al final de esta lección, podrás:

1. **Manejar** errores en callbacks usando la convención error-first
2. **Capturar** rechazos de Promesas usando `.catch()` y `try-catch` con async/await
3. **Prevenir** que rechazos de Promesas no manejados crasheen tu aplicación
4. **Implementar** manejo de errores para emisores de eventos y streams
5. **Entender** la diferencia entre errores operacionales y errores de programador
6. **Practicar** _premeditatio malorum_ - preparar manejadores de errores antes de que ocurran errores

---

## 📖 Introducción: La Paciencia de la Anticipación

### Errores Que Aún No Han Ocurrido

Los errores síncronos son inmediatos. Llamas una función, lanza, la capturas. El ciclo de retroalimentación es instantáneo. Pero Node.js está construido sobre asincronía—operaciones que comienzan ahora y terminan después. Leer archivos, consultar bases de datos, hacer solicitudes HTTP—todas toman tiempo, y sus errores llegan en el futuro.

Esta desconexión temporal crea un desafío único. Cuando escribes `fs.readFile('data.txt', callback)`, la función retorna inmediatamente, pero la operación de archivo sucede después. Si el archivo no existe, ¿cuándo ocurre el error? No cuando llamas la función, sino segundos después cuando el filesystem responde.

Aquí es donde muchos desarrolladores tropiezan. Escriben código que maneja errores inmediatos pero olvidan prepararse para los demorados. Es como el Estoico practicando visualización negativa—_premeditatio malorum_—imaginando qué podría salir mal antes de que suceda, y preparando respuestas por adelantado.

**Séneca** escribió en _Cartas desde un Estoico_:

> _"El golpe inesperado cae más pesado. Ensáyalos en tu mente: exilio, tortura, guerra, naufragio. Todos los términos de nuestra suerte humana deben estar ante nuestros ojos."_

En programación asíncrona, ensayamos errores antes de que ocurran. Escribimos manejadores de errores para callbacks que aún no han sido llamados, cláusulas catch para promesas que aún no se han resuelto, y escuchadores de eventos para errores que aún no han sido emitidos. Esto no es pesimismo—es sabiduría.

### Los Tres Patrones de Manejo de Errores Asíncronos

Node.js ha evolucionado tres patrones para manejar errores asíncronos, cada uno representando una era diferente de JavaScript:

1. **Callbacks error-first** (más antiguo, aún ampliamente usado en APIs core de Node.js)
2. **Rechazos de Promesas** (moderno, encadenable, propagación de errores mejorada)
3. **Async/await** (más nuevo, hace que el código async parezca síncrono, usa try-catch)

Entender los tres es esencial porque los encontrarás todos en bases de código reales. El Estoico acepta la realidad del código legacy mientras abraza mejoras modernas.

---

## 📚 Contenido Principal

### 1. Callbacks Error-First: La Convención de Node.js

El patrón callback error-first es la solución original de Node.js al manejo de errores asíncronos. Cada callback recibe `error` como su primer parámetro. Si la operación tuvo éxito, `error` es `null`. Si falló, `error` contiene el objeto Error.

```javascript
const fs = require('fs');

// Patrón callback error-first
fs.readFile('data.txt', 'utf8', (error, data) => {
  if (error) {
    // Manejar error
    console.error('Falló leer archivo:', error.message);
    return; // Importante: salir temprano
  }

  // Procesar datos (solo se alcanza si no hay error)
  console.log('Contenidos del archivo:', data);
});
```

**Patrón crítico**: SIEMPRE verifica `error` primero, antes de acceder a `data`. Si olvidas, y ocurrió un error, `data` será `undefined` y tu código fallará misteriosamente.

```javascript
// MALO: No verificar error primero
fs.readFile('data.txt', 'utf8', (error, data) => {
  console.log(data.toUpperCase()); // CRASH si existe error
});

// BUENO: Verificar error, manejarlo, retornar temprano
fs.readFile('data.txt', 'utf8', (error, data) => {
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log(data.toUpperCase()); // Seguro - el error fue manejado
});
```

### 2. Callback Hell y Manejo de Errores

Cuando encadenas múltiples operaciones asíncronas, los callbacks se anidan dentro de callbacks. Cada nivel necesita su propio manejo de errores. Esto es "callback hell"—código profundamente anidado que es difícil de leer y fácil de romper.

```javascript
const fs = require('fs');

// Callback hell con manejo de errores en cada nivel
fs.readFile('users.json', 'utf8', (err1, userData) => {
  if (err1) {
    console.error('Falló leer usuarios:', err1.message);
    return;
  }

  const users = JSON.parse(userData);
  const userId = users[0].id;

  fs.readFile(`profiles/${userId}.json`, 'utf8', (err2, profileData) => {
    if (err2) {
      console.error('Falló leer perfil:', err2.message);
      return;
    }

    const profile = JSON.parse(profileData);

    fs.readFile(`photos/${profile.photoId}.jpg`, (err3, photoData) => {
      if (err3) {
        console.error('Falló leer foto:', err3.message);
        return;
      }

      console.log('¡Éxito! Cargó usuario, perfil y foto');
    });
  });
});
```

Nota el manejo de errores repetitivo en cada nivel. Esto funciona pero es tedioso y propenso a errores. Si olvidas verificar `err2`, toda la cadena falla silenciosamente. Las Promesas resuelven esto.

### 3. Promesas: Encadenamiento con .catch()

Las Promesas representan un valor que estará disponible en el futuro. Pueden estar en tres estados: pendiente (esperando), cumplida (éxito), o rechazada (error). Las promesas rechazadas propagan sus errores por la cadena hasta ser capturadas.

```javascript
const fs = require('fs').promises; // API fs basada en Promesas

// Cadena de Promesas con un solo manejador de errores
fs.readFile('users.json', 'utf8')
  .then((userData) => {
    const users = JSON.parse(userData);
    return fs.readFile(`profiles/${users[0].id}.json`, 'utf8');
  })
  .then((profileData) => {
    const profile = JSON.parse(profileData);
    return fs.readFile(`photos/${profile.photoId}.jpg`);
  })
  .then((photoData) => {
    console.log('¡Éxito! Cargó usuario, perfil y foto');
  })
  .catch((error) => {
    // Captura errores de CUALQUIER paso en la cadena
    console.error('Error en cadena:', error.message);
  });
```

**Insight clave**: Solo necesitas UN `.catch()` al final para manejar errores de CUALQUIER paso. Si `readFile` falla en el paso 2, la ejecución salta los pasos 3 y 4 y va directamente a `.catch()`. Esto es _amor fati_ en acción—aceptar que cualquier paso podría fallar y preparar una única respuesta con gracia.

### 4. Async/Await: Manejo de Errores con Apariencia Síncrona

Async/await hace que el código asíncrono parezca síncrono. Puedes usar bloques try-catch justo como con código síncrono, aunque las operaciones sean asíncronas.

```javascript
const fs = require('fs').promises;

async function loadUserData(userId) {
  try {
    const userData = await fs.readFile('users.json', 'utf8');
    const users = JSON.parse(userData);

    const profileData = await fs.readFile(`profiles/${userId}.json`, 'utf8');
    const profile = JSON.parse(profileData);

    const photoData = await fs.readFile(`photos/${profile.photoId}.jpg`);

    return { users, profile, photoData };
  } catch (error) {
    // Captura errores de CUALQUIER declaración await
    console.error('Falló cargar datos de usuario:', error.message);
    throw error; // Re-lanzar si el llamador debe manejarlo
  }
}

// Usando la función async
loadUserData(123)
  .then((data) => console.log('Cargado:', data))
  .catch((error) => console.error('Error:', error.message));
```

**Mejor práctica**: Usa async/await para código nuevo. Es más legible, más fácil de depurar, y usa sintaxis try-catch familiar. Pero debes entender callbacks y promesas porque los encontrarás en código existente y APIs de Node.js.

### 5. Rechazos de Promesas No Manejados: El Asesino Silencioso

Si rechazas una promesa y nunca adjuntas un manejador `.catch()`, Node.js registra una advertencia pero NO crashea (en Node.js 14 y anteriores). Comenzando en Node.js 15, los rechazos no manejados crashean el proceso por defecto—el comportamiento correcto.

```javascript
// MALO: Rechazo de Promesa sin .catch()
function riskyOperation() {
  return Promise.reject(new Error('Algo salió mal'));
}

riskyOperation(); // UnhandledPromiseRejectionWarning (crashea en Node 15+)

// BUENO: Siempre manejar rechazos de promesas
riskyOperation().catch((error) => console.error('Manejado:', error.message));

// TAMBIÉN BUENO: Manejador global para rechazos perdidos
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo No Manejado en:', promise, 'razón:', reason);
  // Registrar en servicio de rastreo de errores
  // Decidir si salir o continuar
});
```

El manejador global `unhandledRejection` es tu red de seguridad. Captura rechazos que perdiste en otro lugar. Piensa en él como la aceptación final del Estoico: "Me preparé para errores, pero si uno se escapó, lo manejaré con dignidad."

### 6. Eventos de Error en Emisores de Eventos

Los emisores de eventos (streams, servidores, emisores personalizados) emiten errores como eventos en lugar de lanzar excepciones. Si no escuchas el evento 'error', Node.js lanza el error como una excepción no capturada, crasheando tu proceso.

```javascript
const EventEmitter = require('events');

// MALO: No hay escuchador de errores - crasheará si se emite error
const emitter = new EventEmitter();
emitter.emit('error', new Error('Algo se rompió')); // CRASH

// BUENO: Escuchar errores
const emitter = new EventEmitter();

emitter.on('error', (error) => {
  console.error('Error del emisor:', error.message);
});

emitter.emit('error', new Error('Algo se rompió')); // Manejado con gracia
```

**Ejemplo del mundo real**: Servidores HTTP

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.end('Hello World');
});

// CRÍTICO: Siempre escuchar errores del servidor
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('El puerto ya está en uso');
  } else {
    console.error('Error del servidor:', error.message);
  }
});

server.listen(3000);
```

Sin el escuchador de errores, si el puerto 3000 ya está en uso, tu servidor crashea con una excepción no capturada. Con el escuchador, obtienes un mensaje de error significativo y puedes intentar un puerto diferente.

### 7. Errores Operacionales vs Errores de Programador

Entender la distinción entre errores operacionales y de programador te ayuda a decidir cómo manejarlos.

**Errores Operacionales**: Problemas esperados que surgen de condiciones de runtime

- Archivo no encontrado
- Timeout de red
- Conexión a base de datos falló
- Entrada de usuario inválida
- Disco lleno

**Manejo**: Capturar, registrar, reintentar, o retornar error al usuario. Tu programa debe continuar ejecutándose.

**Errores de Programador**: Bugs en tu código

- Llamar función con argumentos incorrectos
- Acceder propiedad de `undefined`
- Olvidar manejar callback
- Error lógico en algoritmo

**Manejo**: Estos NO deben ser capturados. Déjalos crashear, arregla el bug, despliega código corregido. Capturar errores de programador enmascara bugs.

```javascript
// Error operacional - manejar con gracia
async function getUser(id) {
  try {
    const user = await database.find(id);
    return user;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      // Operacional: base de datos caída
      console.error('Base de datos no disponible');
      return null;
    }
    throw error; // Error desconocido, dejarlo propagar
  }
}

// Error de programador - debe crashear durante desarrollo
function calculateArea(width, height) {
  // Sin manejo de errores - si se llama mal, debe crashear
  // para que arregles el bug
  return width * height;
}

calculateArea('10', 20); // BUG: string en lugar de número
// Retorna '1020' en lugar de 200 - error lógico
// Debe fallar ruidosamente en tests para que lo arregles
```

---

## 💻 Ejercicios Prácticos

### Ejercicio 1: Convertir Callbacks a Promesas

Convierte esta función basada en callbacks para que retorne una Promesa:

```javascript
const fs = require('fs');

// Versión callback
function readConfig(filename, callback) {
  fs.readFile(filename, 'utf8', (error, data) => {
    if (error) {
      callback(error, null);
      return;
    }

    try {
      const config = JSON.parse(data);
      callback(null, config);
    } catch (parseError) {
      callback(parseError, null);
    }
  });
}

// Versión Promise
function readConfig(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        const config = JSON.parse(data);
        resolve(config);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Uso
readConfig('config.json')
  .then((config) => console.log('Config:', config))
  .catch((error) => console.error('Error:', error.message));
```

**Explicación de la Solución**: Envolver callbacks en Promesas los hace encadenables y permite usar sintaxis moderna async/await. Nota cómo tanto errores de lectura de archivo como de parsing JSON son capturados y convertidos a rechazos.

### Ejercicio 2: Manejo de Errores con Async/Await

Reescribe este código de callbacks anidados usando async/await:

```javascript
// Versión callback
function processUserData(userId, callback) {
  database.getUser(userId, (err1, user) => {
    if (err1) return callback(err1);

    database.getPosts(user.id, (err2, posts) => {
      if (err2) return callback(err2);

      database.getComments(posts[0].id, (err3, comments) => {
        if (err3) return callback(err3);

        callback(null, { user, posts, comments });
      });
    });
  });
}

// Versión async/await
async function processUserData(userId) {
  try {
    const user = await database.getUser(userId);
    const posts = await database.getPosts(user.id);
    const comments = await database.getComments(posts[0].id);

    return { user, posts, comments };
  } catch (error) {
    console.error('Error procesando datos de usuario:', error.message);
    throw error;
  }
}

// Uso
async function main() {
  try {
    const data = await processUserData(123);
    console.log('Data:', data);
  } catch (error) {
    console.error('Falló:', error.message);
  }
}
```

**Explicación de la Solución**: La versión async/await es dramáticamente más legible. Operaciones async secuenciales parecen operaciones sync secuenciales. Un try-catch captura errores de las tres llamadas a base de datos.

### Ejercicio 3: Manejar Errores de Stream

Crea un copiador de archivos que maneje errores de ambos streams de lectura y escritura:

```javascript
const fs = require('fs');

function copyFile(source, destination) {
  const readStream = fs.createReadStream(source);
  const writeStream = fs.createWriteStream(destination);

  // Manejar errores de lectura
  readStream.on('error', (error) => {
    console.error('Error de lectura:', error.message);
    writeStream.destroy(); // Detener stream de escritura
  });

  // Manejar errores de escritura
  writeStream.on('error', (error) => {
    console.error('Error de escritura:', error.message);
    readStream.destroy(); // Detener stream de lectura
  });

  // Manejar finalización exitosa
  writeStream.on('finish', () => {
    console.log('Archivo copiado exitosamente');
  });

  // Hacer pipe de lectura a escritura
  readStream.pipe(writeStream);
}

// Uso
copyFile('source.txt', 'destination.txt');
```

**Explicación de la Solución**: Los streams emiten errores como eventos. Tanto streams de lectura como escritura pueden fallar independientemente (origen no existe, disco de destino está lleno). Manejamos ambos, y crucialmente, cuando uno falla, destruimos el otro para prevenir fugas de recursos.

---

## 🤔 Reflexión Filosófica: Preparándose para lo Desconocido

La práctica Estoica de _premeditatio malorum_—visualización negativa—significa imaginar regularmente qué podría salir mal y prepararse mentalmente para ello. Séneca hacía esto diariamente: "¿Qué pasa si pierdo mi riqueza? ¿Qué pasa si alguien me traiciona? ¿Qué pasa si enfermo?"

Esto suena pesimista, pero en realidad es liberador. Cuando ya has imaginado un desastre y preparado tu respuesta, el desastre real pierde su poder de sorprenderte. Ya has decidido cómo reaccionarás.

El manejo de errores asíncronos es el _premeditatio malorum_ del programador. Escribes manejadores `.catch()` para promesas que aún no se han resuelto. Escuchas eventos 'error' que aún no han sido emitidos. Envuelves declaraciones `await` en try-catch para excepciones que aún no han sido lanzadas.

Esto no es pesimismo. Es profesionalismo.

El desarrollador que escribe:

```javascript
const data = await fetchData();
```

...está siendo excesivamente optimista. Está asumiendo que nada saldrá mal.

El desarrollador que escribe:

```javascript
try {
  const data = await fetchData();
} catch (error) {
  // Manejar error
}
```

...está practicando _premeditatio malorum_. Ha imaginado la red fallando, la API caída, los datos mal formados. Y ha preparado una respuesta.

**Epicteto**: _"Si deseas ser escritor, escribe. Si deseas ser libre, prepárate."_

Si deseas escribir código asíncrono robusto, prepárate para errores antes de que ocurran.

---

## ✅ Verificación de Conocimiento

Prueba tu comprensión respondiendo estas preguntas:

- [ ] Entiendo el patrón callback error-first y siempre verifico error antes de data
- [ ] Puedo explicar cómo los rechazos de Promesas se propagan a través de cadenas `.then()`
- [ ] Puedo usar try-catch con async/await para manejar errores asíncronos
- [ ] Sé cómo prevenir que rechazos de Promesas no manejados crasheen mi app
- [ ] Siempre escucho eventos 'error' en emisores de eventos y streams
- [ ] Puedo distinguir entre errores operacionales (manejar) y errores de programador (crashear)
- [ ] Veo cómo _premeditatio malorum_ aplica al manejo de errores async

---

## 📝 Resumen

El manejo de errores asíncronos requiere preparación y paciencia. Los errores no ocurren inmediatamente—llegan en el futuro cuando las operaciones se completan. Debes escribir manejadores de errores por adelantado, confiando en que se activarán cuando sea necesario.

Los tres patrones—callbacks, promesas, async/await—cada uno maneja errores async de manera diferente pero comparten el mismo principio: anticipar el fracaso y preparar una respuesta. Los callbacks error-first verifican `error` antes de `data`. Las Promesas propagan rechazos a `.catch()`. Async/await usa try-catch alrededor de declaraciones `await`.

Los errores más peligrosos son los que no manejas: rechazos de Promesas no manejados y eventos 'error' no escuchados. Ambos crashean tu proceso. Siempre adjunta manejadores.

Finalmente, distingue errores operacionales (esperados, manejar con gracia) de errores de programador (bugs, deben crashear en desarrollo). Amor fati significa aceptar errores operacionales como inevitables. Pero los errores de programador no son destino—son errores a arreglar.

### Vista Previa: Lección 3 - Estrategias de Errores en Producción

En producción, el manejo de errores va más allá de try-catch. Necesitas logging, monitoreo, degradación con gracia, y estrategias de recuperación. En la lección final, aprenderás:

- **Manejo de errores centralizado** con middleware de errores
- **Logging estructurado** para depurar problemas de producción
- **Servicios de rastreo de errores** (Sentry, Rollbar)
- **Apagado con gracia** cuando ocurren errores fatales
- **Circuit breakers** para prevenir fallos en cascada
- **Health checks** y recuperación automática

**Conexión Estoica**: En producción, los errores no son solo aprendizaje personal—afectan usuarios. El desarrollador Estoico construye sistemas que manejan adversidad con gracia, protegiendo a otros de las consecuencias de fallos inevitables.

---

## 🔗 Referencias

**Documentación Técnica**:

1. Node.js Errors: https://nodejs.org/docs/latest/api/errors.html
2. Node.js Promises: https://nodejs.org/docs/latest/api/promises.html
3. Async/Await: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
4. Event Emitters: https://nodejs.org/docs/latest/api/events.html
5. Unhandled Rejections: https://nodejs.org/docs/latest/api/process.html#process_event_unhandledrejection

**Filosofía Estoica**: 6. "Cartas desde un Estoico" de Séneca - Carta 91, Sobre Premeditatio Malorum 7. "Meditaciones" de Marco Aurelio - Libro 8, Sobre Preparación 8. "Discursos" de Epicteto - Libro 3, Capítulo 10, Sobre Previsión

---

**FIN DE LA LECCIÓN 2**

_Recuerda: El futuro es incierto, pero tu preparación puede ser completa. Escribe manejadores de errores ahora para errores que llegarán después. Esto no es pesimismo—es sabiduría._

🟠 **Siguiente**: Lección 3 - Estrategias de Errores en Producción (40 minutos)
