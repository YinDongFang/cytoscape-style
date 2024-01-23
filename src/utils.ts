import cytoscape from 'cytoscape';

// styleEnabled: true开启样式，构造器中会创建Style实例，从而可以overrideStyleFunction
export const cy = cytoscape({ styleEnabled: true });

// Get scratch pad reserved for this extension on the given element or the core if 'name' parameter is not set,
// if the 'name' parameter is set then return the related property in the scratch instead of the whole scratchpad
export function getScratch(namespace: string, eleOrCy: any, name?: string) {
  if (eleOrCy.scratch(namespace) === undefined) {
    eleOrCy.scratch(namespace, {});
  }
  const scratchPad = eleOrCy.scratch(namespace);
  return name === undefined ? scratchPad : scratchPad[name];
}

// Set the a field (described by 'name' parameter) of scratchPad (that is reserved for this extension
// on an element or the core) to the given value (by 'val' parameter)
export function setScratch(namespace: string, eleOrCy: any, name: string, val: any) {
  const scratchPad = getScratch(namespace, eleOrCy);
  scratchPad[name] = val;
  eleOrCy.scratch(namespace, scratchPad);
}

// HACK: 通过重写覆盖的方式扩展cytoscape中Core原型函数
export function overrideCoreFunction(
  property: string,
  newFn: (srcFn: (...args: any[]) => any) => (...args: any) => void,
) {
  const corePrototype = Object.getPrototypeOf(cy);
  const srcFn = corePrototype[property];
  corePrototype[property] = newFn(srcFn);
}

// HACK: 通过重写覆盖的方式扩展cytoscape中Collection原型函数
export function overrideCollectionFunction(
  property: string,
  newFn: (srcFn: (...args: any[]) => any) => (...args: any) => void,
) {
  const corePrototype = Object.getPrototypeOf(cy.collection());
  const srcFn = corePrototype[property];
  corePrototype[property] = newFn(srcFn);
}

// HACK: 通过重写覆盖的方式扩展cytoscape中Style原型函数
export function overrideStyleFunction(
  property: string,
  newFn: (srcFn: (...args: any[]) => any) => (...args: any) => void,
) {
  const stylePrototype = Object.getPrototypeOf(cy.style());
  const srcFn = stylePrototype[property];
  stylePrototype[property] = newFn(srcFn);
}

type ExtensionContructor = new (_cy: cytoscape.Core, ...args: any) => any;

// 创建单例模型的插件实例
export function createSingleInstanceExtension(name: string, ctor: ExtensionContructor) {
  return function (this: cytoscape.Core, ...args) {
    if (!this._private[name]) {
      this._private[name] = new ctor(this, ...args);
    }
    const instance = this._private[name];
    return instance;
  };
}

declare module 'cytoscape' {
  interface Collection extends Array<any> {
    cy: () => cytoscape.Core;
    unique: () => cytoscape.Collection;
  }
  interface Core {
    mutableElements: () => cytoscape.Collection;
    cyCanvas: (...args: any) => any;
    emitter: () => any;
    _private: any;
  }
}
