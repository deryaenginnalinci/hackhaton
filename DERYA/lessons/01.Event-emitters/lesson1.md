# Lección 1: Introducción a EventEmitters - El Patrón Observador

**Minicurso**: Event Emitters (Amarillo - Superando la Codicia)  
**Lección**: 1 de 3  
**Duración**: 30 minutos  
**Tema Estoico**: Compartir el Control - Confiando en otros para responder apropiadamente

---

## 🎯 Objetivos de Aprendizaje

Al final de esta lección, serás capaz de:

1. **Explicar** el patrón Observador y cómo EventEmitter lo implementa en Node.js
2. **Crear** instancias de EventEmitter y registrar oyentes usando `.on()` y `.once()`
3. **Emitir** eventos con datos usando `.emit()`
4. **Remover** oyentes usando `.removeListener()` y `.removeAllListeners()`
5. **Entender** la conexión filosófica entre eventos y el principio estoico de compartir el control
6. **Practicar** la virtud estoica de confiar en otros mientras proporcionas estructura

---

## 📖 Introducción: La Paradoja del Control

### La Ilusión del Control Total

En programación, como en la vida, existe una tensión fundamental entre el control y la flexibilidad. Cuando escribes código que controla directamente cada aspecto del comportamiento de tu sistema—llamando funciones específicas en momentos específicos, gestionando cada interacción—creas software que es predecible pero rígido. Este código funciona exactamente como lo especificaste, pero es frágil: cada nuevo requisito requiere cambios en múltiples lugares. Cada componente debe conocer y coordinar con cada otro componente.

Este acoplamiento estrecho refleja lo que los filósofos estoicos llamaban "codicia"—no en el sentido de dinero, sino el deseo de poseer, controlar y dominar. Es el impulso de aferrarse firmemente a cada detalle, de no confiar en nadie más con responsabilidad, de microgestionar cada interacción. Este impulso se siente seguro en el momento pero conduce al agotamiento, tanto en la gestión humana como en la arquitectura de software.

Los filósofos estoicos enseñaron un enfoque diferente. **Marco Aurelio**, el emperador romano cuyas *Meditaciones* siguen siendo un clásico del pensamiento estoico, escribió:

> _"El impedimento a la acción hace avanzar la acción. Lo que se interpone en el camino se convierte en el camino."_

Aplicado a la programación, esto significa que nuestros intentos de control total en realidad nos impiden crear software verdaderamente flexible. La rigidez que creamos al controlar cada interacción se convierte en el obstáculo para la escalabilidad, mantenibilidad y extensibilidad. El camino adelante es a través de la **delegación**—compartir el control en lugar de acapararlo.

### EventEmitter: Arquitectura Basada en Confianza

El patrón EventEmitter de Node.js encarna la virtud estoica de compartir el control. Cuando un componente emite un evento, está diciendo: "Algo importante acaba de suceder. He hecho mi trabajo al anunciar esto. Ahora confío en que otros respondan apropiadamente." El emisor no sabe quién está escuchando. No controla qué harán los oyentes con la información. No puede ni siquiera garantizar que alguien esté escuchando en absoluto.

Esta incertidumbre puede sentirse incómoda para los programadores acostumbrados a las llamadas directas a funciones donde sabes exactamente qué sucederá a continuación. Pero esta incomodidad señala exactamente dónde tiene lugar el crecimiento. Al confiar en los oyentes para manejar eventos apropiadamente, creas sistemas que son:

- **Desacoplados**: Los componentes no necesitan conocerse entre sí
- **Extensibles**: Los nuevos oyentes pueden agregarse sin modificar el código existente
- **Escalables**: Las responsabilidades se distribuyen entre múltiples oyentes
- **Resilientes**: Un oyente fallando no derriba todo el sistema

Esta es la sabiduría estoica aplicada a la arquitectura: proporciona estructura (eventos), comparte información (datos del evento), luego deja ir el control de lo que sucede después. Confía en que el sistema se auto-organizará apropiadamente.

---

## 📚 Contenido Principal

### 1. El Patrón Observador: Definición de un Problema

Antes de sumergirnos en los EventEmitters de Node.js, entendamos el problema que resuelven.

Imagina que estás construyendo un sistema de pedidos. Cuando se crea un pedido, necesitas:

1. Guardar el pedido en la base de datos
2. Enviar un correo de confirmación al cliente
3. Notificar al almacén para que prepare el envío
4. Actualizar el análisis
5. Registrar la transacción

El enfoque de control estricto sería así:

```javascript
class OrderService {
  createOrder(orderData) {
    // Guardar pedido
    const order = this.database.save(orderData);
    
    // Ahora debe conocer y llamar a cada sistema dependiente
    this.emailService.sendConfirmation(order);
    this.warehouseService.notifyNewOrder(order);
    this.analyticsService.trackOrder(order);
    this.logger.log('Order created:', order.id);
    
    return order;
  }
}
```

**Problemas con este enfoque:**

1. **Acoplamiento estrecho**: `OrderService` debe conocer sobre `emailService`, `warehouseService`, `analyticsService` y `logger`
2. **Frágil**: Si `emailService` lanza un error, falla todo el proceso de creación del pedido
3. **Inflexible**: Agregar un nuevo sistema (por ejemplo, notificaciones de SMS) requiere modificar `OrderService`
4. **No escalable**: Cada nueva acción del pedido necesita una llamada directa explícita

### 2. El Patrón Observador: La Solución

El patrón Observador resuelve esto invirtiendo el flujo de control. En lugar de que el emisor (OrderService) llame directamente a cada oyente, el emisor simplemente anuncia eventos. Los oyentes se suscriben a los eventos que les interesan.

```javascript
const EventEmitter = require('events');

class OrderService extends EventEmitter {
  createOrder(orderData) {
    // Guardar pedido
    const order = this.database.save(orderData);
    
    // Anunciar que sucedió algo importante
    this.emit('orderCreated', order);
    
    return order;
  }
}

// Ahora otros sistemas se suscriben
const orderService = new OrderService();

// Servicio de Email escucha
orderService.on('orderCreated', (order) => {
  emailService.sendConfirmation(order);
});

// Servicio de Almacén escucha
orderService.on('orderCreated', (order) => {
  warehouseService.notifyNewOrder(order);
});

// Análisis escucha
orderService.on('orderCreated', (order) => {
  analyticsService.trackOrder(order);
});

// Logger escucha
orderService.on('orderCreated', (order) => {
  logger.log('Order created:', order.id);
});
```

**Beneficios de este enfoque:**

1. **Desacoplado**: `OrderService` no conoce a ningún oyente
2. **Resiliente**: Si `emailService` falla, otros oyentes aún procesan el evento
3. **Extensible**: Agregar nuevas funcionalidades es solo agregar nuevos oyentes
4. **Escalable**: Los oyentes pueden procesar eventos de forma independiente, incluso en paralelo

Este es el patrón Observador: **un sujeto (el emisor) mantiene una lista de dependientes (oyentes) y les notifica automáticamente de cualquier cambio de estado.**

### 3. EventEmitter de Node.js: La Implementación

Node.js proporciona una implementación incorporada del patrón Observador llamada `EventEmitter`. Es una de las herramientas más fundamentales en Node.js—muchas APIs principales (streams, HTTP servers, procesos hijos) son EventEmitters.

**Creando un EventEmitter:**

```javascript
const EventEmitter = require('events');

// Crear una instancia
const emitter = new EventEmitter();

// O extiende EventEmitter en tu propia clase
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
```

**Anatomía de un Evento:**

Un evento tiene tres partes:

1. **Nombre del evento** (string): Identifica qué sucedió
2. **Datos** (opcional): Información sobre lo que sucedió
3. **Oyentes** (funciones): Código que responde al evento

### 4. Registrando Oyentes: `.on()` y `.once()`

Para responder a eventos, registras funciones oyentes.

**`.on(eventName, listener)` - Oyente permanente:**

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

// Registrar un oyente
emitter.on('greeting', (name) => {
  console.log(`Hello, ${name}!`);
});

// Emitir el evento múltiples veces
emitter.emit('greeting', 'Alice');  // Output: Hello, Alice!
emitter.emit('greeting', 'Bob');    // Output: Hello, Bob!
emitter.emit('greeting', 'Charlie'); // Output: Hello, Charlie!
```

El oyente permanece registrado y se ejecuta cada vez que se emite el evento.

**`.once(eventName, listener)` - Oyente de un solo uso:**

```javascript
const emitter = new EventEmitter();

// Registrar oyente de un solo uso
emitter.once('greeting', (name) => {
  console.log(`Hello, ${name}!`);
});

emitter.emit('greeting', 'Alice');  // Output: Hello, Alice!
emitter.emit('greeting', 'Bob');    // No output (oyente ya se removió)
```

`.once()` automáticamente remueve el oyente después de su primera ejecución. Esto es útil para eventos de inicialización, conexiones, o cualquier cosa que debería suceder solo una vez.

**Múltiples Oyentes:**

Puedes registrar múltiples oyentes para el mismo evento. Se ejecutarán en el orden en que fueron registrados.

```javascript
const emitter = new EventEmitter();

emitter.on('data', () => {
  console.log('First listener');
});

emitter.on('data', () => {
  console.log('Second listener');
});

emitter.on('data', () => {
  console.log('Third listener');
});

emitter.emit('data');

// Output:
// First listener
// Second listener
// Third listener
```

### 5. Emitiendo Eventos: `.emit()`

Para anunciar que algo ha sucedido, usas `.emit()`.

**Sintaxis básica:**

```javascript
emitter.emit(eventName, ...args);
```

**Sin datos:**

```javascript
const emitter = new EventEmitter();

emitter.on('ready', () => {
  console.log('System is ready!');
});

emitter.emit('ready');  // Output: System is ready!
```

**Con un argumento:**

```javascript
const emitter = new EventEmitter();

emitter.on('message', (text) => {
  console.log('Received message:', text);
});

emitter.emit('message', 'Hello World');
// Output: Received message: Hello World
```

**Con múltiples argumentos:**

```javascript
const emitter = new EventEmitter();

emitter.on('userCreated', (id, name, email) => {
  console.log(`User created: ${id}, ${name}, ${email}`);
});

emitter.emit('userCreated', 1, 'Alice', 'alice@example.com');
// Output: User created: 1, Alice, alice@example.com
```

**Con objetos (patrón recomendado):**

Para eventos complejos, pasa un solo objeto con propiedades nombradas. Esto hace que tu código sea más mantenible porque puedes agregar propiedades sin romper oyentes existentes.

```javascript
const emitter = new EventEmitter();

emitter.on('userCreated', (userData) => {
  console.log(`User created: ${userData.id}, ${userData.name}`);
  console.log(`Email: ${userData.email}`);
  console.log(`Role: ${userData.role}`);
});

emitter.emit('userCreated', {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});
```

### 6. Removiendo Oyentes

Para prevenir fugas de memoria y limpiar cuando la funcionalidad ya no es necesaria, debes remover oyentes.

**`.removeListener(eventName, listener)` o `.off(eventName, listener)`:**

```javascript
const emitter = new EventEmitter();

function greet(name) {
  console.log(`Hello, ${name}`);
}

emitter.on('greeting', greet);

emitter.emit('greeting', 'Alice');  // Output: Hello, Alice

// Remover el oyente específico
emitter.removeListener('greeting', greet);

emitter.emit('greeting', 'Bob');    // No output (oyente removido)
```

**Importante**: Debes pasar la misma referencia de función que pasaste a `.on()`. Esto es por qué las funciones anónimas son problemáticas para la remoción.

```javascript
// ❌ INCORRECTO - No se puede remover
emitter.on('data', () => {
  console.log('Anonymous function - cannot remove');
});

// No puedes remover porque no tienes una referencia
// emitter.removeListener('data', ???);

// ✅ CORRECTO - Usa función nombrada o guarda referencia
const handler = () => {
  console.log('Named function - can remove');
};

emitter.on('data', handler);
emitter.removeListener('data', handler);  // Funciona
```

**`.removeAllListeners([eventName])`:**

Remueve todos los oyentes para un evento específico, o todos los oyentes para todos los eventos si no se proporciona nombre.

```javascript
const emitter = new EventEmitter();

emitter.on('data', () => console.log('Listener 1'));
emitter.on('data', () => console.log('Listener 2'));
emitter.on('error', () => console.log('Error handler'));

// Remover todos los oyentes 'data'
emitter.removeAllListeners('data');

emitter.emit('data');   // No output
emitter.emit('error');  // Output: Error handler (still exists)

// Remover TODOS los oyentes de TODOS los eventos
emitter.removeAllListeners();

emitter.emit('error');  // No output (todos removidos)
```

**⚠️ Advertencia**: `removeAllListeners()` es poderoso pero peligroso. Úsalo solo cuando estés seguro de que quieres remover todos los oyentes, como durante el cierre de una aplicación.

### 7. Manejando Eventos de Error

Los eventos `'error'` son especiales en EventEmitter. Si emites un evento `'error'` y no hay oyentes registrados para él, Node.js lanzará el error, lo que puede causar que tu aplicación se caiga.

```javascript
const emitter = new EventEmitter();

// ❌ MAL - Sin manejador de error
emitter.emit('error', new Error('Something went wrong'));
// Esto lanzará y potencialmente hará caer tu aplicación

// ✅ BUENO - Siempre maneja eventos de error
emitter.on('error', (err) => {
  console.error('Error occurred:', err.message);
});

emitter.emit('error', new Error('Something went wrong'));
// Output: Error occurred: Something went wrong
```

**Mejor práctica**: Siempre registra al menos un oyente `'error'` en cada EventEmitter que crees.

---

## 💻 Ejercicios Prácticos

### Ejercicio 1: Sistema Básico de Publicación-Suscripción

Construye un sistema simple de publicación-suscripción que permita a los suscriptores recibir mensajes basados en temas.

```javascript
const EventEmitter = require('events');

class MessageBus extends EventEmitter {
  publish(topic, message) {
    // TODO: Emitir evento para el tema con el mensaje
  }

  subscribe(topic, handler) {
    // TODO: Registrar oyente para el tema
  }
}

// Probar tu implementación
const bus = new MessageBus();

bus.subscribe('news', (message) => {
  console.log('News:', message);
});

bus.subscribe('sports', (message) => {
  console.log('Sports:', message);
});

bus.publish('news', 'Breaking: EventEmitters are awesome!');
bus.publish('sports', 'Local team wins championship!');
bus.publish('news', 'Study shows events improve code quality');

// Output esperado:
// News: Breaking: EventEmitters are awesome!
// Sports: Local team wins championship!
// News: Study shows events improve code quality
```

**Solución:**

```javascript
const EventEmitter = require('events');

class MessageBus extends EventEmitter {
  publish(topic, message) {
    this.emit(topic, message);
  }

  subscribe(topic, handler) {
    this.on(topic, handler);
  }

  unsubscribe(topic, handler) {
    this.removeListener(topic, handler);
  }
}

// Prueba
const bus = new MessageBus();

bus.subscribe('news', (message) => {
  console.log('News:', message);
});

bus.subscribe('sports', (message) => {
  console.log('Sports:', message);
});

bus.publish('news', 'Breaking: EventEmitters are awesome!');
bus.publish('sports', 'Local team wins championship!');
```

### Ejercicio 2: Sistema de Gestión de Usuarios con Eventos

Crea una clase `UserManager` que emita eventos cuando se crean, actualizan o eliminan usuarios.

**Requisitos:**
- Emitir evento `'userCreated'` con datos del usuario cuando se crea un usuario
- Emitir evento `'userUpdated'` con datos antiguos y nuevos cuando se actualiza un usuario  
- Emitir evento `'userDeleted'` con datos del usuario cuando se elimina un usuario
- Emitir evento `'error'` si hay problemas de validación

**Código inicial:**

```javascript
const EventEmitter = require('events');

class UserManager extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
  }

  createUser(userData) {
    // TODO: Validar userData
    // TODO: Crear usuario con ID único
    // TODO: Guardar en this.users
    // TODO: Emitir evento 'userCreated'
  }

  updateUser(id, updates) {
    // TODO: Encontrar usuario
    // TODO: Si no existe, emitir 'error'
    // TODO: Actualizar datos del usuario
    // TODO: Emitir evento 'userUpdated' con datos antiguos y nuevos
  }

  deleteUser(id) {
    // TODO: Encontrar usuario
    // TODO: Si no existe, emitir 'error'
    // TODO: Eliminar de this.users
    // TODO: Emitir evento 'userDeleted'
  }
}

// Probar tu implementación
const userManager = new UserManager();

userManager.on('userCreated', (user) => {
  console.log('✓ User created:', user);
});

userManager.on('userUpdated', (oldData, newData) => {
  console.log('✓ User updated:', oldData.name, '->', newData.name);
});

userManager.on('userDeleted', (user) => {
  console.log('✓ User deleted:', user.name);
});

userManager.on('error', (error) => {
  console.error('✗ Error:', error.message);
});

// Probar
userManager.createUser({ name: 'Alice', email: 'alice@example.com' });
userManager.updateUser(1, { name: 'Alice Smith' });
userManager.deleteUser(1);
userManager.deleteUser(999); // Debería emitir error
```

**Solución:**

```javascript
const EventEmitter = require('events');

class UserManager extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.nextId = 1;
  }

  createUser(userData) {
    // Validación
    if (!userData.name || !userData.email) {
      this.emit('error', new Error('Name and email are required'));
      return null;
    }

    // Crear usuario
    const user = {
      id: this.nextId++,
      name: userData.name,
      email: userData.email,
      createdAt: new Date()
    };

    // Guardar
    this.users.set(user.id, user);

    // Emitir evento
    this.emit('userCreated', user);

    return user;
  }

  updateUser(id, updates) {
    // Encontrar usuario
    const user = this.users.get(id);

    if (!user) {
      this.emit('error', new Error(`User ${id} not found`));
      return null;
    }

    // Guardar estado antiguo
    const oldData = { ...user };

    // Actualizar
    Object.assign(user, updates, { updatedAt: new Date() });

    // Emitir evento
    this.emit('userUpdated', oldData, user);

    return user;
  }

  deleteUser(id) {
    // Encontrar usuario
    const user = this.users.get(id);

    if (!user) {
      this.emit('error', new Error(`User ${id} not found`));
      return null;
    }

    // Eliminar
    this.users.delete(id);

    // Emitir evento
    this.emit('userDeleted', user);

    return user;
  }
}

// Prueba completa
const userManager = new UserManager();

userManager.on('userCreated', (user) => {
  console.log('✓ User created:', user.name, `(ID: ${user.id})`);
});

userManager.on('userUpdated', (oldData, newData) => {
  console.log('✓ User updated:', oldData.name, '->', newData.name);
});

userManager.on('userDeleted', (user) => {
  console.log('✓ User deleted:', user.name);
});

userManager.on('error', (error) => {
  console.error('✗ Error:', error.message);
});

// Ejecutar pruebas
const user1 = userManager.createUser({ name: 'Alice', email: 'alice@example.com' });
const user2 = userManager.createUser({ name: 'Bob', email: 'bob@example.com' });

userManager.updateUser(user1.id, { name: 'Alice Smith' });
userManager.deleteUser(user2.id);
userManager.deleteUser(999); // Error: usuario no encontrado
userManager.createUser({ name: 'Charlie' }); // Error: falta email
```

---

## 🤔 Reflexión Filosófica: Compartir el Control

### El Dilema del Programador de Control

Cuando escribes `emitter.emit('dataReceived', data)`, estás realizando un acto de fe. No sabes quién está escuchando. No puedes controlar qué harán con los datos. Ni siquiera puedes garantizar que alguien esté escuchando en absoluto. Para muchos programadores, esto se siente peligroso—como gritar en el vacío.

Pero esta es precisamente la virtud que los estoicos cultivaban: distinguir entre lo que puedes controlar y lo que no puedes, y soltar el control de este último. **Epicteto** enseñó:

> _"Tenemos control sobre nuestras opiniones, aspiraciones, deseos, y las cosas que nos repelen. No tenemos control sobre nuestro cuerpo, propiedad, reputación, cargo—en resumen, sobre cualquier cosa que no sea nuestra propia acción."_

En programación con eventos:

- **Puedes controlar**: Qué eventos emites, cuándo los emites, qué datos incluyes
- **No puedes controlar**: Quién escucha, qué hacen con los eventos, si lo manejan correctamente

Aceptar esta distinción te libera para escribir código mejor. En lugar de intentar controlar toda la cadena de causa y efecto (lo cual crea acoplamiento estrecho), proporcionas estructura (eventos) y confías en que otros responderán apropiadamente.

### Confianza como Virtud Técnica

La confianza no es ingenuidad. Cuando emites eventos, no estás siendo descuidado—estás siendo deliberado sobre los límites. Estás diciendo: "Mi responsabilidad es anunciar lo que sucedió con exactitud y claridad. Tu responsabilidad es responder apropiadamente a esa notificación."

Esta división de responsabilidades crea sistemas más robustos porque:

1. **Cada componente tiene un propósito claro**: Los emisores anuncian, los oyentes responden
2. **Los fallos están aislados**: Un oyente fallando no derriba al emisor o a otros oyentes
3. **La complejidad está distribuida**: No hay un componente "dios" que sepa todo y controle todo
4. **El cambio es más fácil**: Los nuevos oyentes pueden agregarse sin modificar los emisores

Esta es la misma sabiduría que los estoicos aplicaban a las relaciones humanas. Un líder sabio proporciona dirección clara, luego confía en su equipo para ejecutar. Un padre sabio enseña principios, luego confía en sus hijos para aplicarlos. Un programador sabio define eventos, luego confía en los oyentes para responder.

### Preguntas de Autoevaluación

Reflexiona sobre cómo abordas el control en tu programación:

1. **¿Dónde en tu código intentas controlar demasiado?** Busca lugares donde un componente conoce demasiados detalles sobre otros componentes.

2. **¿Qué te hace dudar en usar eventos?** ¿Es la incertidumbre sobre quién está escuchando? ¿Es el sentimiento de perder el control?

3. **¿Cómo podrías rediseñar un sistema acoplado existente usando eventos?** Elige una clase que llame directamente a muchos otros servicios. ¿Podría emitir eventos en su lugar?

4. **¿Qué patrones paralelos ves en tu vida no técnica?** ¿Dónde intentas controlar resultados que están más allá de tu control? ¿Cómo podrías soltar mientras mantienes la responsabilidad?

---

## 📝 Resumen y Próximos Pasos

### Verificación de Conclusiones Clave

Después de completar esta lección, deberías entender:

- [ ] El patrón Observador y cómo desacopla componentes
- [ ] Cómo crear instancias de EventEmitter
- [ ] Cómo registrar oyentes con `.on()` y `.once()`
- [ ] Cómo emitir eventos con `.emit()` y pasar datos
- [ ] Cómo remover oyentes con `.removeListener()` y `.removeAllListeners()`
- [ ] Por qué los eventos `'error'` son especiales y deben manejarse siempre
- [ ] La conexión filosófica entre eventos y la virtud estoica de compartir el control

### Lo Que Hemos Aprendido

Los EventEmitters de Node.js implementan el patrón Observador, permitiéndote construir sistemas desacoplados y orientados a eventos. En lugar de que los componentes se llamen directamente entre sí (acoplamiento estrecho), los componentes emiten eventos que otros pueden escuchar (acoplamiento suelto). Este patrón hace que tu código sea más mantenible, extensible y resiliente.

Más importante aún, has visto cómo los EventEmitters encarnan el principio estoico de compartir el control. Cuando emites un evento, confías en los oyentes para responder apropiadamente. Esto puede sentirse incómodo al principio—como soltar el control—pero es precisamente esta delegación la que crea sistemas robustos y escalables.

### Vista Previa: Lección 2 - EventEmitters Personalizados y Patrones

En la próxima lección, profundizaremos en crear tus propias clases que extiendan EventEmitter. Aprenderás:

- **Patrones comunes de eventos**: eventos de ciclo de vida, eventos de cambio de estado, eventos de flujo de datos
- **Convenciones de nomenclatura**: cómo nombrar eventos para que tu código sea autodocumentado
- **Composición vs herencia**: cuándo extender EventEmitter vs cuándo contener una instancia
- **Encadenar emisores**: construir sistemas complejos desde múltiples emisores

**Conexión Estoica**: Exploraremos cómo construir emisores personalizados es como el principio estoico de enseñar—proporcionas estructura y sabiduría (eventos), pero confías en que otros aprendan y respondan a su manera.

---

## 🔗 Referencias

**Documentación Técnica**:
1. API EventEmitter de Node.js: https://nodejs.org/docs/latest/api/events.html
2. Patrón Observador (Gang of Four): Design Patterns: Elements of Reusable Object-Oriented Software
3. Patrones de Programación Orientada a Eventos: https://en.wikipedia.org/wiki/Event-driven_programming

**Filosofía Estoica**:
4. "Meditaciones" de Marco Aurelio - Libro 4, Sobre el control y la aceptación
5. "Manual" de Epicteto - Sobre la dicotomía del control
6. "Cartas de un Estoico" de Séneca - Carta 107, Sobre obedecer la voluntad del universo

---

**FIN DE LA LECCIÓN 1**

_Recuerda: Así como los estoicos enseñaban que la verdadera libertad viene de soltar lo que no puedes controlar, la verdadera flexibilidad del software viene de emitir eventos y confiar en los oyentes para responder apropiadamente. Controla lo que puedes (qué eventos emites), suelta lo que no puedes (cómo responden los oyentes)._

🟡 **Siguiente**: Lección 2 - EventEmitters Personalizados y Patrones (30 minutos)
