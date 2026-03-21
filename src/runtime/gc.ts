export class GarbageCollector {
  private heap: Map<number, GCNode> = new Map();
  private roots: Set<any> = new Set();
  private nextId: number = 0;
  private reachable: Set<number> = new Set();
  
  constructor() {
    // Run GC periodically
    setInterval(() => this.collect(), 1000);
  }
  
  allocate(obj: any): number {
    const id = this.nextId++;
    this.heap.set(id, { obj, marked: false, id });
    
    // Add GC ID to object for debugging
    if (typeof obj === 'object' && obj !== null) {
      obj._gcId = id;
    }
    
    return id;
  }
  
  addRoot(obj: any): void {
    this.roots.add(obj);
  }
  
  removeRoot(obj: any): void {
    this.roots.delete(obj);
  }
  
  collect(): void {
    this.reachable.clear();
    
    // Mark phase - start from roots
    for (const root of this.roots) {
      this.mark(root);
    }
    
    // Sweep phase - remove unreachable objects
    for (const [id, node] of this.heap) {
      if (!this.reachable.has(id)) {
        // Clean up object references
        if (node.obj && typeof node.obj === 'object') {
          delete node.obj._gcId;
        }
        this.heap.delete(id);
      } else {
        node.marked = false;
      }
    }
  }
  
  private mark(obj: any): void {
    if (obj === null || typeof obj !== 'object') return;
    
    const id = obj._gcId;
    if (id === undefined) return;
    
    const node = this.heap.get(id);
    if (!node || node.marked) return;
    
    node.marked = true;
    this.reachable.add(id);
    
    // Mark all properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        this.mark(obj[key]);
      }
    }
    
    // Mark array elements
    if (Array.isArray(obj)) {
      for (const element of obj) {
        this.mark(element);
      }
    }
    
    // Mark Map/Set entries
    if (obj instanceof Map) {
      for (const [key, value] of obj) {
        this.mark(key);
        this.mark(value);
      }
    }
    
    if (obj instanceof Set) {
      for (const value of obj) {
        this.mark(value);
      }
    }
  }
  
  getStats(): GCStats {
    let totalSize = 0;
    let markedCount = 0;
    
    for (const node of this.heap.values()) {
      totalSize++;
      if (node.marked) markedCount++;
    }
    
    return {
      totalObjects: this.heap.size,
      reachableObjects: markedCount,
      unreachableObjects: this.heap.size - markedCount
    };
  }
}

interface GCNode {
  obj: any;
  marked: boolean;
  id: number;
}

interface GCStats {
  totalObjects: number;
  reachableObjects: number;
  unreachableObjects: number;
}