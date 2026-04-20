// Helper functions to get department/position names from IDs for display

/**
 * Get department name from criteria object
 * @param criteria - Object containing department_id or department property
 * @param departmentsList - Array of department objects with id and name properties
 * @returns Department name or null if not found
 */
export const getDepartmentName = (criteria: any, departmentsList: any[]): string | null => {
  if (!criteria) return null
  
  // If department_id exists, look it up in the departments list
  if (criteria.department_id !== undefined && criteria.department_id !== null) {
    const dept = departmentsList.find((d: any) => {
      // Handle both string and number ID comparisons
      return d.id === criteria.department_id || 
             d.id === Number(criteria.department_id) ||
             String(d.id) === String(criteria.department_id)
    })
    return dept?.name || null
  }
  
  // Fallback to department name (backward compatibility)
  return criteria.department || null
}

/**
 * Get position name from criteria object
 * @param criteria - Object containing position_id or position property
 * @param positionsList - Array of position objects with id and job_title properties
 * @returns Position name (job_title) or null if not found
 */
export const getPositionName = (criteria: any, positionsList: any[]): string | null => {
  if (!criteria) return null
  
  // If position_id exists, look it up in the positions list
  if (criteria.position_id !== undefined && criteria.position_id !== null) {
    const pos = positionsList.find((p: any) => {
      // Handle both string and number ID comparisons
      return p.id === criteria.position_id || 
             p.id === Number(criteria.position_id) ||
             String(p.id) === String(criteria.position_id)
    })
    return pos?.job_title || null
  }
  
  // Fallback to position name (backward compatibility)
  return criteria.position || null
}
