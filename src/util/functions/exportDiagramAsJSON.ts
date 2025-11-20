import PouchDB from 'pouchdb';
import log from 'loglevel';

const logger = log.getLogger('exportDiagramAsJSON');

export interface DiagramExport {
    name: string;
    dbName: string;
    exportDate: string;
    version: string;
    entities: any[];
    metadata?: any;
}

/**
 * Exports the current diagram as a JSON file
 * @param dbName - The name of the PouchDB database to export
 * @param includeMetadata - Whether to include the metadata document in the export
 */
export async function exportDiagramAsJSON(dbName: string, includeMetadata: boolean = false): Promise<void> {
    try {
        logger.info(`Exporting diagram: ${dbName}`);

        // Access the PouchDB database
        const db = new PouchDB(dbName);

        // Get all documents
        const allDocs = await db.allDocs({ include_docs: true });

        // Filter out metadata (unless requested) and extract entities
        const entities = allDocs.rows
            .filter(row => includeMetadata || row.doc._id !== 'metadata')
            .map(row => {
                // Remove PouchDB internal fields for cleaner export
                const { _rev, ...cleanDoc } = row.doc;
                return cleanDoc;
            });

        // Get metadata if it exists
        let metadata = null;
        if (includeMetadata) {
            try {
                metadata = await db.get('metadata');
                const { _rev, ...cleanMetadata } = metadata;
                metadata = cleanMetadata;
            } catch (err) {
                logger.warn('No metadata found');
            }
        }

        // Get friendly name from localStorage if available
        const friendlyName = localStorage.getItem(dbName) || dbName;

        // Create export object
        const exportData: DiagramExport = {
            name: friendlyName,
            dbName: dbName,
            exportDate: new Date().toISOString(),
            version: '1.0',
            entities: entities.filter(e => e._id !== 'metadata'),
        };

        if (includeMetadata && metadata) {
            exportData.metadata = metadata;
        }

        // Convert to formatted JSON
        const json = JSON.stringify(exportData, null, 2);

        // Create and trigger download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Create filename with sanitized diagram name
        const sanitizedName = friendlyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        link.download = `diagram-${sanitizedName}-${timestamp}.json`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL
        URL.revokeObjectURL(url);

        logger.info(`Export complete: ${link.download}`);

    } catch (error) {
        logger.error('Error exporting diagram:', error);
        throw new Error(`Failed to export diagram: ${error.message}`);
    }
}

/**
 * Imports a diagram from a JSON file
 * This can be used to load template diagrams from static hosting
 * @param jsonData - The parsed JSON data from the export
 * @param targetDbName - Optional: Override the database name from the export
 */
export async function importDiagramFromJSON(jsonData: DiagramExport, targetDbName?: string): Promise<string> {
    try {
        const dbName = targetDbName || jsonData.dbName;
        logger.info(`Importing diagram to: ${dbName}`);

        // Create/open database
        const db = new PouchDB(dbName);

        // Import metadata if present
        if (jsonData.metadata) {
            try {
                await db.put(jsonData.metadata);
            } catch (err) {
                logger.warn('Could not import metadata:', err);
            }
        }

        // Import all entities
        for (const entity of jsonData.entities) {
            try {
                await db.put(entity);
            } catch (err) {
                // If document exists, update it
                if (err.status === 409) {
                    const existing = await db.get(entity._id);
                    await db.put({ ...entity, _rev: existing._rev });
                } else {
                    logger.error('Error importing entity:', entity._id, err);
                }
            }
        }

        // Store friendly name in localStorage
        if (jsonData.name) {
            localStorage.setItem(dbName, jsonData.name);
        }

        logger.info(`Import complete: ${jsonData.entities.length} entities imported`);

        return dbName;

    } catch (error) {
        logger.error('Error importing diagram:', error);
        throw new Error(`Failed to import diagram: ${error.message}`);
    }
}
