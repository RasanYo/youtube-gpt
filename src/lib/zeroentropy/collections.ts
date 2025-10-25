import { getZeroEntropyClient } from './client'

/**
 * Create a user-scoped collection for storing video transcripts
 * 
 * @param userId - User ID for scoping
 * @returns Collection name
 */
export async function createUserCollection(userId: string): Promise<string> {
  const client = getZeroEntropyClient()
  const collectionName = `user-${userId}-videos`
  
  try {
    console.log(`[createUserCollection] Creating collection: ${collectionName}`)
    
    await client.collections.add({
      collection_name: collectionName
    })
    
    console.log(`[createUserCollection] Successfully created collection: ${collectionName}`)
    return collectionName
    
  } catch (error: any) {
    if (error.status === 409) {
      console.log(`[createUserCollection] Collection already exists: ${collectionName}`)
      return collectionName
    }
    
    console.error(`[createUserCollection] Failed to create collection: ${collectionName}`, error)
    throw new Error(`Failed to create collection: ${error.message}`)
  }
}

/**
 * Check if a collection exists
 * 
 * @param collectionName - Collection name to check
 * @returns True if collection exists, false otherwise
 */
export async function collectionExists(collectionName: string): Promise<boolean> {
  const client = getZeroEntropyClient()
  
  try {
    const response = await client.collections.getList()
    return response.collection_names.includes(collectionName)
  } catch (error: any) {
    console.error(`[collectionExists] Failed to check collection existence: ${collectionName}`, error)
    return false
  }
}

/**
 * Get or create a user collection (create if doesn't exist)
 * 
 * @param userId - User ID for scoping
 * @returns Collection name
 */
export async function getOrCreateUserCollection(userId: string): Promise<string> {
  const collectionName = `user-${userId}-videos`
  
  const exists = await collectionExists(collectionName)
  if (exists) {
    console.log(`[getOrCreateUserCollection] Collection exists: ${collectionName}`)
    return collectionName
  }
  
  return await createUserCollection(userId)
}

/**
 * Delete a user collection
 * 
 * @param userId - User ID for scoping
 * @returns True if deleted successfully
 */
export async function deleteUserCollection(userId: string): Promise<boolean> {
  const client = getZeroEntropyClient()
  const collectionName = `user-${userId}-videos`
  
  try {
    console.log(`[deleteUserCollection] Deleting collection: ${collectionName}`)
    
    await client.collections.delete({
      collection_name: collectionName
    })
    
    console.log(`[deleteUserCollection] Successfully deleted collection: ${collectionName}`)
    return true
    
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`[deleteUserCollection] Collection not found: ${collectionName}`)
      return true // Consider it deleted if it doesn't exist
    }
    
    console.error(`[deleteUserCollection] Failed to delete collection: ${collectionName}`, error)
    throw new Error(`Failed to delete collection: ${error.message}`)
  }
}

/**
 * List all collections for a user
 * 
 * @param userId - User ID for scoping
 * @returns Array of collection names
 */
export async function listUserCollections(userId: string): Promise<string[]> {
  const client = getZeroEntropyClient()
  
  try {
    const response = await client.collections.getList()
    const userCollections = response.collection_names.filter(name => 
      name.startsWith(`user-${userId}-`)
    )
    
    console.log(`[listUserCollections] Found ${userCollections.length} collections for user: ${userId}`)
    return userCollections
    
  } catch (error: any) {
    console.error(`[listUserCollections] Failed to list collections for user: ${userId}`, error)
    throw new Error(`Failed to list collections: ${error.message}`)
  }
}
