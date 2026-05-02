import { findModuleById, novalabModules } from '../data/novalabModules';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getModules() {
  await wait(180);

  return {
    success: true,
    data: novalabModules,
  };
}

export async function getModule(moduleId) {
  await wait(80);

  const module = findModuleById(moduleId);

  if (!module) {
    return {
      success: false,
      message: 'Module not found.',
    };
  }

  return {
    success: true,
    data: module,
  };
}
