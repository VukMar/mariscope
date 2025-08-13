export async function nameToId(name) {
  // Lowercase the name
  let id = name.toLowerCase();
  // Remove all characters except letters, numbers, and spaces (keep apostrophes out)
  id = id.replace(/[^a-z0-9\s]/g, '');
  // Replace spaces with underscores
  id = id.replace(/\s+/g, '_');
  // Add prefix and return
  return `#bottominfo_${id}`;
}

export async function simplifyName(name) {
  // Lowercase the name
  let simplified = name.toLowerCase();
  // Remove all characters except letters, numbers, and spaces (keep apostrophes out)
  simplified = simplified.replace(/[^a-z0-9\s]/g, '');
  // Replace spaces with dots
  simplified = simplified.replace(/\s+/g,'.');
  //Capitalize first letter
  simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
  // Return
  return simplified;
}