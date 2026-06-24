export const can = (userPermissions, action) => {
  // Si no es un array o no existe, deniega acceso
  if (!Array.isArray(userPermissions)) return false;
  
  // El admin tiene 'all'
  if (userPermissions.includes('all')) return true;
  
  // Solo devuelve true si la acción está presente en el array
  return userPermissions.includes(action);
};