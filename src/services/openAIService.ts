import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { logger } from '../utils/logger';

interface OpenAICredentials {
  apiKey: string;
  createdAt: string;
  userId: string;
}

class OpenAIService {
  private static instance: OpenAIService;
  private credentials: OpenAICredentials | null = null;
  private readonly fileName = 'openAIService.ts';

  private constructor() {
    logger.info('OpenAIService', 'Initializing service', {
      fileName: this.fileName
    });
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Invalidates the cached credentials, forcing a refresh on the next API call.
   */
  public invalidateCache(): void {
    logger.debug('OpenAIService', 'Invalidating credentials cache', {
      fileName: this.fileName
    });
    this.credentials = null;
  }

  /**
   * Gets the user's OpenAI API key from Firestore
   * @returns Promise resolving to the API key
   */
  public async getAPIKey(): Promise<string> {
    if (this.credentials?.apiKey) {
      return this.credentials.apiKey;
    }

    const credentials = await this.getCredentials();
    return credentials.apiKey;
  }

  /**
   * Saves an OpenAI API key to Firestore
   * @param apiKey The OpenAI API key to save
   * @returns Promise that resolves when the key is saved
   */
  public async saveAPIKey(apiKey: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      logger.error('OpenAIService', 'User not authenticated', { fileName: this.fileName });
      throw new Error('User not authenticated');
    }

    const db = getFirestore();
    const credentialsData: OpenAICredentials = {
      apiKey,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'openAI', 'credentials'), credentialsData);
      this.credentials = credentialsData;
      
      logger.success('OpenAIService', 'Successfully saved OpenAI API key', {
        fileName: this.fileName,
        userId: user.uid
      });
    } catch (error) {
      logger.error('OpenAIService', 'Failed to save OpenAI API key', {
        fileName: this.fileName,
        error: (error as Error).message
      });
      throw new Error('Failed to save OpenAI API key: ' + (error as Error).message);
    }
  }

  /**
   * Fetches OpenAI credentials from Firestore
   * @private
   * @returns Promise resolving to the credentials
   */
  private async getCredentials(): Promise<OpenAICredentials> {
    if (this.credentials) {
      return this.credentials;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      logger.error('OpenAIService', 'User not authenticated', { fileName: this.fileName });
      throw new Error('User not authenticated');
    }

    logger.debug('OpenAIService', 'Fetching OpenAI credentials', {
      fileName: this.fileName,
      userId: user.uid
    });

    const db = getFirestore();
    
    try {
      const credentialsDoc = await getDoc(doc(db, 'users', user.uid, 'openAI', 'credentials'));
      
      if (!credentialsDoc.exists()) {
        logger.error('OpenAIService', 'OpenAI credentials not found', {
          fileName: this.fileName,
          userId: user.uid
        });
        throw new Error('OpenAI API key not found');
      }

      const data = credentialsDoc.data() as OpenAICredentials;
      
      if (!data.apiKey) {
        logger.error('OpenAIService', 'Invalid OpenAI credentials', {
          fileName: this.fileName,
          userId: user.uid
        });
        throw new Error('Invalid OpenAI API key');
      }
      
      this.credentials = data;

      logger.success('OpenAIService', 'Successfully loaded OpenAI credentials', {
        fileName: this.fileName,
        userId: user.uid
      });

      return data;
    } catch (error) {
      if ((error as Error).message === 'OpenAI API key not found' || 
          (error as Error).message === 'Invalid OpenAI API key') {
        throw error;
      }
      
      logger.error('OpenAIService', 'Error fetching OpenAI credentials', {
        fileName: this.fileName,
        error: (error as Error).message
      });
      throw new Error('Failed to fetch OpenAI credentials: ' + (error as Error).message);
    }
  }

  /**
   * Verifies if an OpenAI API key is valid by making a test request
   * @param apiKey The OpenAI API key to test
   * @returns Promise resolving to a boolean indicating if the key is valid
   */
  public async verifyAPIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        logger.success('OpenAIService', 'API key verification successful', {
          fileName: this.fileName,
          status: response.status
        });
        return true;
      } else {
        logger.error('OpenAIService', 'API key verification failed', {
          fileName: this.fileName,
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error) {
      logger.error('OpenAIService', 'API key verification error', {
        fileName: this.fileName,
        error: (error as Error).message
      });
      return false;
    }
  }
}

export const openAIService = OpenAIService.getInstance();
