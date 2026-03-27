// =============================================================================
// ESTRUCTURAS DE DATOS — CodeTutor
// Implementaciones propias usadas en toda la aplicación
// =============================================================================

// ─── Pila (Stack) ─────────────────────────────────────────────────────────────
// Estructura LIFO (último en entrar, primero en salir)
// USO: historial de acciones del editor (undo), historial de navegación entre pantallas
export class Stack<T> {
  private items: T[] = [];

  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
  toArray(): T[] { return [...this.items]; }
  clear(): void { this.items = []; }
}

// ─── Cola (Queue) ─────────────────────────────────────────────────────────────
// Estructura FIFO (primero en entrar, primero en salir)
// USO: cola de solicitudes de análisis de código pendientes al backend
export class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
  front(): T | undefined { return this.items[0]; }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
  toArray(): T[] { return [...this.items]; }
}

// ─── Lista Simple Enlazada (Singly LinkedList) ────────────────────────────────
// Cada nodo apunta al siguiente
// USO: historial de versiones del código (cada snapshot guardado agrega un nodo)
export class LinkedListNode<T> {
  value: T;
  next: LinkedListNode<T> | null = null;
  constructor(value: T) { this.value = value; }
}

export class LinkedList<T> {
  private head: LinkedListNode<T> | null = null;
  private _size = 0;

  append(value: T): void {
    const node = new LinkedListNode(value);
    if (!this.head) { this.head = node; }
    else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this._size++;
  }

  prepend(value: T): void {
    const node = new LinkedListNode(value);
    node.next = this.head;
    this.head = node;
    this._size++;
  }

  delete(value: T): void {
    if (!this.head) return;
    if (this.head.value === value) { this.head = this.head.next; this._size--; return; }
    let cur = this.head;
    while (cur.next) {
      if (cur.next.value === value) { cur.next = cur.next.next; this._size--; return; }
      cur = cur.next;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur) { result.push(cur.value); cur = cur.next; }
    return result;
  }

  size(): number { return this._size; }
}

// ─── Lista Doblemente Enlazada (Doubly LinkedList) ────────────────────────────
// Cada nodo apunta al siguiente Y al anterior
// USO: historial de análisis navegable (ir hacia adelante y atrás entre análisis)
export class DoublyNode<T> {
  value: T;
  next: DoublyNode<T> | null = null;
  prev: DoublyNode<T> | null = null;
  constructor(value: T) { this.value = value; }
}

export class DoublyLinkedList<T> {
  private head: DoublyNode<T> | null = null;
  private tail: DoublyNode<T> | null = null;
  private _size = 0;

  append(value: T): void {
    const node = new DoublyNode(value);
    if (!this.tail) { this.head = this.tail = node; }
    else { node.prev = this.tail; this.tail.next = node; this.tail = node; }
    this._size++;
  }

  prepend(value: T): void {
    const node = new DoublyNode(value);
    if (!this.head) { this.head = this.tail = node; }
    else { node.next = this.head; this.head.prev = node; this.head = node; }
    this._size++;
  }

  delete(value: T): void {
    let cur = this.head;
    while (cur) {
      if (cur.value === value) {
        if (cur.prev) cur.prev.next = cur.next; else this.head = cur.next;
        if (cur.next) cur.next.prev = cur.prev; else this.tail = cur.prev;
        this._size--;
        return;
      }
      cur = cur.next;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur) { result.push(cur.value); cur = cur.next; }
    return result;
  }

  toArrayReverse(): T[] {
    const result: T[] = [];
    let cur = this.tail;
    while (cur) { result.push(cur.value); cur = cur.prev; }
    return result;
  }

  size(): number { return this._size; }
}

// ─── Lista Circular (Circular LinkedList) ─────────────────────────────────────
// El último nodo apunta de vuelta al primero
// USO: rotación de sugerencias de IA (ciclar entre sugerencias disponibles)
export class CircularNode<T> {
  value: T;
  next: CircularNode<T> | null = null;
  constructor(value: T) { this.value = value; }
}

export class CircularLinkedList<T> {
  private head: CircularNode<T> | null = null;
  private _size = 0;

  append(value: T): void {
    const node = new CircularNode(value);
    if (!this.head) { this.head = node; node.next = node; }
    else {
      let cur = this.head;
      while (cur.next !== this.head) cur = cur.next!;
      cur.next = node;
      node.next = this.head;
    }
    this._size++;
  }

  delete(value: T): void {
    if (!this.head) return;
    if (this.head.value === value && this._size === 1) { this.head = null; this._size--; return; }
    let cur = this.head;
    let prev: CircularNode<T> | null = null;
    do {
      if (cur.value === value) {
        if (prev) prev.next = cur.next;
        if (cur === this.head) this.head = cur.next;
        this._size--;
        return;
      }
      prev = cur;
      cur = cur.next!;
    } while (cur !== this.head);
  }

  // Obtiene el siguiente elemento en el ciclo (útil para rotar sugerencias)
  next(value: T): T | undefined {
    let cur = this.head;
    if (!cur) return undefined;
    do {
      if (cur.value === value) return cur.next?.value;
      cur = cur.next!;
    } while (cur !== this.head);
    return undefined;
  }

  toArray(): T[] {
    const result: T[] = [];
    if (!this.head) return result;
    let cur = this.head;
    do { result.push(cur.value); cur = cur.next!; } while (cur !== this.head);
    return result;
  }

  size(): number { return this._size; }
}

// ─── Lista Circular Doble (Doubly Circular LinkedList) ────────────────────────
// Cada nodo apunta al siguiente Y al anterior, y el último apunta al primero
// USO: navegación circular entre proyectos del dashboard (prev/next)
export class DoublyCircularNode<T> {
  value: T;
  next: DoublyCircularNode<T> | null = null;
  prev: DoublyCircularNode<T> | null = null;
  constructor(value: T) { this.value = value; }
}

export class DoublyCircularLinkedList<T> {
  private head: DoublyCircularNode<T> | null = null;
  private _size = 0;

  append(value: T): void {
    const node = new DoublyCircularNode(value);
    if (!this.head) {
      this.head = node;
      node.next = node;
      node.prev = node;
    } else {
      const tail = this.head.prev!;
      tail.next = node;
      node.prev = tail;
      node.next = this.head;
      this.head.prev = node;
    }
    this._size++;
  }

  delete(value: T): void {
    if (!this.head) return;
    let cur = this.head;
    do {
      if (cur.value === value) {
        if (this._size === 1) { this.head = null; this._size--; return; }
        cur.prev!.next = cur.next;
        cur.next!.prev = cur.prev;
        if (cur === this.head) this.head = cur.next;
        this._size--;
        return;
      }
      cur = cur.next!;
    } while (cur !== this.head);
  }

  toArray(): T[] {
    const result: T[] = [];
    if (!this.head) return result;
    let cur = this.head;
    do { result.push(cur.value); cur = cur.next!; } while (cur !== this.head);
    return result;
  }

  size(): number { return this._size; }
}

// ─── Matriz (Matrix) ──────────────────────────────────────────────────────────
// Arreglo bidimensional de filas x columnas
// USO: representar la cuadrícula de caracteres del editor (línea x columna)
export class Matrix<T> {
  private data: T[][];
  readonly rows: number;
  readonly cols: number;

  constructor(rows: number, cols: number, defaultValue: T) {
    this.rows = rows;
    this.cols = cols;
    this.data = Array.from({ length: rows }, () => Array(cols).fill(defaultValue));
  }

  get(row: number, col: number): T { return this.data[row][col]; }

  set(row: number, col: number, value: T): void { this.data[row][col] = value; }

  getRow(row: number): T[] { return [...this.data[row]]; }

  getCol(col: number): T[] { return this.data.map((r) => r[col]); }

  toArray(): T[][] { return this.data.map((r) => [...r]); }

  // Transponer la matriz (filas ↔ columnas)
  transpose(): Matrix<T> {
    const result = new Matrix<T>(this.cols, this.rows, this.data[0][0]);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        result.set(c, r, this.data[r][c]);
    return result;
  }
}

// ─── HashMap ──────────────────────────────────────────────────────────────────
// Mapa clave-valor con acceso O(1)
// USO: almacenar explicaciones de funciones detectadas, keyed por nombre de función
export class HashMap<K extends string, V> {
  private map: Record<string, V> = {};

  set(key: K, value: V): void { this.map[key] = value; }
  get(key: K): V | undefined { return this.map[key]; }
  has(key: K): boolean { return Object.prototype.hasOwnProperty.call(this.map, key); }
  delete(key: K): void { delete this.map[key]; }
  keys(): K[] { return Object.keys(this.map) as K[]; }
  values(): V[] { return Object.values(this.map); }
  entries(): [K, V][] { return Object.entries(this.map) as [K, V][]; }
  clear(): void { this.map = {}; }
  size(): number { return Object.keys(this.map).length; }
}

// ─── Árbol Binario de Búsqueda (BST) ─────────────────────────────────────────
// Cada nodo tiene máximo dos hijos; izquierdo < nodo < derecho
// USO: búsqueda rápida de proyectos por ID o nombre
export class BSTNode<T> {
  value: T;
  left: BSTNode<T> | null = null;
  right: BSTNode<T> | null = null;
  constructor(value: T) { this.value = value; }
}

export class BinarySearchTree<T> {
  private root: BSTNode<T> | null = null;

  insert(value: T, compare: (a: T, b: T) => number): void {
    const node = new BSTNode(value);
    if (!this.root) { this.root = node; return; }
    let cur = this.root;
    while (true) {
      if (compare(value, cur.value) < 0) {
        if (!cur.left) { cur.left = node; return; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = node; return; }
        cur = cur.right;
      }
    }
  }

  search(value: T, compare: (a: T, b: T) => number): BSTNode<T> | null {
    let cur = this.root;
    while (cur) {
      const cmp = compare(value, cur.value);
      if (cmp === 0) return cur;
      cur = cmp < 0 ? cur.left : cur.right;
    }
    return null;
  }

  // Recorrido en orden (inorder): izquierdo → raíz → derecho
  inorder(): T[] {
    const result: T[] = [];
    const traverse = (node: BSTNode<T> | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }
}

// ─── Árbol AVL ────────────────────────────────────────────────────────────────
// BST auto-balanceado; garantiza altura O(log n)
// USO: índice balanceado de snapshots para búsqueda eficiente por versión
export class AVLNode<T> {
  value: T;
  left: AVLNode<T> | null = null;
  right: AVLNode<T> | null = null;
  height = 1;
  constructor(value: T) { this.value = value; }
}

export class AVLTree<T> {
  private root: AVLNode<T> | null = null;

  private height(n: AVLNode<T> | null): number { return n ? n.height : 0; }

  private updateHeight(n: AVLNode<T>): void {
    n.height = 1 + Math.max(this.height(n.left), this.height(n.right));
  }

  private balanceFactor(n: AVLNode<T>): number {
    return this.height(n.left) - this.height(n.right);
  }

  private rotateRight(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    y.left = x.right;
    x.right = y;
    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  private rotateLeft(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    x.right = y.left;
    y.left = x;
    this.updateHeight(x);
    this.updateHeight(y);
    return y;
  }

  private balance(n: AVLNode<T>): AVLNode<T> {
    this.updateHeight(n);
    const bf = this.balanceFactor(n);
    if (bf > 1) {
      if (n.left && this.balanceFactor(n.left) < 0) n.left = this.rotateLeft(n.left);
      return this.rotateRight(n);
    }
    if (bf < -1) {
      if (n.right && this.balanceFactor(n.right) > 0) n.right = this.rotateRight(n.right);
      return this.rotateLeft(n);
    }
    return n;
  }

  private _insert(node: AVLNode<T> | null, value: T, compare: (a: T, b: T) => number): AVLNode<T> {
    if (!node) return new AVLNode(value);
    if (compare(value, node.value) < 0) node.left = this._insert(node.left, value, compare);
    else node.right = this._insert(node.right, value, compare);
    return this.balance(node);
  }

  insert(value: T, compare: (a: T, b: T) => number): void {
    this.root = this._insert(this.root, value, compare);
  }

  inorder(): T[] {
    const result: T[] = [];
    const traverse = (n: AVLNode<T> | null) => {
      if (!n) return;
      traverse(n.left);
      result.push(n.value);
      traverse(n.right);
    };
    traverse(this.root);
    return result;
  }
}

// ─── Árbol N-ario (N-ary Tree) ────────────────────────────────────────────────
// Cada nodo puede tener N hijos (sin límite)
// USO: representar la estructura de carpetas del explorador de archivos virtual
export class NaryNode<T> {
  value: T;
  children: NaryNode<T>[] = [];
  constructor(value: T) { this.value = value; }

  addChild(child: NaryNode<T>): void { this.children.push(child); }

  removeChild(value: T): void {
    this.children = this.children.filter((c) => c.value !== value);
  }
}

export class NaryTree<T> {
  root: NaryNode<T> | null = null;

  // Búsqueda en anchura (BFS)
  bfs(): T[] {
    if (!this.root) return [];
    const result: T[] = [];
    const queue: NaryNode<T>[] = [this.root];
    while (queue.length) {
      const node = queue.shift()!;
      result.push(node.value);
      queue.push(...node.children);
    }
    return result;
  }

  // Búsqueda en profundidad (DFS)
  dfs(): T[] {
    const result: T[] = [];
    const traverse = (node: NaryNode<T>) => {
      result.push(node.value);
      node.children.forEach(traverse);
    };
    if (this.root) traverse(this.root);
    return result;
  }
}

// ─── Grafo (Graph) ────────────────────────────────────────────────────────────
// Conjunto de nodos conectados por aristas (dirigido o no dirigido)
// USO: mapa de dependencias entre archivos del proyecto (qué archivo importa a cuál)
export class Graph<T extends string> {
  private adjacency: Map<T, Set<T>> = new Map();
  private directed: boolean;

  constructor(directed = false) { this.directed = directed; }

  addVertex(vertex: T): void {
    if (!this.adjacency.has(vertex)) this.adjacency.set(vertex, new Set());
  }

  addEdge(from: T, to: T): void {
    this.addVertex(from);
    this.addVertex(to);
    this.adjacency.get(from)!.add(to);
    if (!this.directed) this.adjacency.get(to)!.add(from);
  }

  removeEdge(from: T, to: T): void {
    this.adjacency.get(from)?.delete(to);
    if (!this.directed) this.adjacency.get(to)?.delete(from);
  }

  removeVertex(vertex: T): void {
    this.adjacency.delete(vertex);
    this.adjacency.forEach((neighbors) => neighbors.delete(vertex));
  }

  neighbors(vertex: T): T[] {
    return Array.from(this.adjacency.get(vertex) ?? []);
  }

  vertices(): T[] { return Array.from(this.adjacency.keys()); }

  // Recorrido BFS desde un vértice origen
  bfs(start: T): T[] {
    const visited = new Set<T>();
    const result: T[] = [];
    const queue: T[] = [start];
    visited.add(start);
    while (queue.length) {
      const v = queue.shift()!;
      result.push(v);
      for (const neighbor of this.neighbors(v)) {
        if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
      }
    }
    return result;
  }

  // Recorrido DFS desde un vértice origen
  dfs(start: T): T[] {
    const visited = new Set<T>();
    const result: T[] = [];
    const traverse = (v: T) => {
      visited.add(v);
      result.push(v);
      for (const neighbor of this.neighbors(v)) {
        if (!visited.has(neighbor)) traverse(neighbor);
      }
    };
    traverse(start);
    return result;
  }

  // Detectar si existe un ciclo (útil para detectar dependencias circulares)
  hasCycle(): boolean {
    const visited = new Set<T>();
    const inStack = new Set<T>();
    const dfs = (v: T): boolean => {
      visited.add(v);
      inStack.add(v);
      for (const neighbor of this.neighbors(v)) {
        if (!visited.has(neighbor) && dfs(neighbor)) return true;
        if (inStack.has(neighbor)) return true;
      }
      inStack.delete(v);
      return false;
    };
    for (const v of this.vertices()) {
      if (!visited.has(v) && dfs(v)) return true;
    }
    return false;
  }
}

// ─── Trie ─────────────────────────────────────────────────────────────────────
// Árbol de prefijos para búsqueda eficiente de palabras
// USO: autocompletado de keywords del lenguaje seleccionado en el editor
export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd = false;
}

export class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) node.children.set(char, new TrieNode());
      node = node.children.get(char)!;
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char)!;
    }
    return node.isEnd;
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char)!;
    }
    return true;
  }

  getWordsWithPrefix(prefix: string): string[] {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }
    const results: string[] = [];
    this._dfs(node, prefix, results);
    return results;
  }

  private _dfs(node: TrieNode, current: string, results: string[]): void {
    if (node.isEnd) results.push(current);
    for (const [char, child] of node.children) this._dfs(child, current + char, results);
  }
}

// ─── Keywords por lenguaje (para el Trie del editor) ─────────────────────────
const KEYWORDS: Record<string, string[]> = {
  javascript: ['const', 'let', 'var', 'function', 'async', 'await', 'class', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'default'],
  typescript: ['const', 'let', 'var', 'function', 'async', 'await', 'class', 'return', 'if', 'else', 'for', 'while', 'interface', 'type', 'enum', 'import', 'export'],
  python: ['def', 'class', 'return', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'with', 'lambda', 'yield', 'pass', 'break', 'continue'],
  java: ['public', 'private', 'protected', 'class', 'void', 'int', 'String', 'return', 'if', 'else', 'for', 'while', 'new', 'this', 'static', 'final'],
  cpp: ['int', 'void', 'class', 'return', 'if', 'else', 'for', 'while', 'new', 'delete', 'include', 'namespace', 'using', 'std', 'cout', 'cin'],
};

export function buildTrieForLanguage(language: string): Trie {
  const trie = new Trie();
  const keywords = KEYWORDS[language] ?? KEYWORDS['javascript'];
  keywords.forEach((kw) => trie.insert(kw));
  return trie;
}
