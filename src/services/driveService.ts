// Google Drive v3 API service for saving certificates, backups, and managing files

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

const FOLDER_NAME = 'CLW Vigilance Awareness Week 2026';

export class DriveService {
  /**
   * Search for or create the dedicated app folder in user's Google Drive
   */
  public static async getOrCreateAppFolder(accessToken: string): Promise<string> {
    // 1. Search for existing folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(FOLDER_NAME)}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // 2. Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    const createData = await createRes.json();
    return createData.id;
  }

  /**
   * Uploads a binary blob or file into a specified folder in Google Drive using multipart upload
   */
  public static async uploadFile(
    accessToken: string,
    fileName: string,
    mimeType: string,
    contentBlob: Blob,
    parentFolderId?: string
  ): Promise<DriveFileItem> {
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name: fileName,
      mimeType: mimeType
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', contentBlob);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime,size', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to upload file to Google Drive');
    }

    return await res.json();
  }

  /**
   * Saves a participant's certificate PNG directly to Google Drive
   */
  public static async saveCertificateToDrive(
    accessToken: string,
    certificateNo: string,
    participantPf: string,
    participantName: string,
    pngBlob: Blob
  ): Promise<DriveFileItem> {
    const folderId = await this.getOrCreateAppFolder(accessToken);
    const fileName = `Certificate-${certificateNo}-${participantPf}-${participantName.replace(/\s+/g, '_')}.png`;
    return await this.uploadFile(accessToken, fileName, 'image/png', pngBlob, folderId);
  }

  /**
   * Backs up participant results CSV directly to Google Drive
   */
  public static async backupResultsToDrive(accessToken: string, csvContent: string): Promise<DriveFileItem> {
    const folderId = await this.getOrCreateAppFolder(accessToken);
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `CLW-VAW-2026-Results-Backup-${timestamp}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return await this.uploadFile(accessToken, fileName, 'text/csv', blob, folderId);
  }

  /**
   * Backs up questions bank JSON directly to Google Drive
   */
  public static async backupQuestionsToDrive(accessToken: string, questionsJson: string): Promise<DriveFileItem> {
    const folderId = await this.getOrCreateAppFolder(accessToken);
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `CLW-VAW-2026-Questions-Bank-${timestamp}.json`;
    const blob = new Blob([questionsJson], { type: 'application/json' });
    return await this.uploadFile(accessToken, fileName, 'application/json', blob, folderId);
  }

  /**
   * Lists files saved in the CLW Vigilance folder
   */
  public static async listAppFiles(accessToken: string): Promise<DriveFileItem[]> {
    const folderId = await this.getOrCreateAppFolder(accessToken);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&orderBy=modifiedTime desc&fields=files(id,name,mimeType,webViewLink,webContentLink,iconLink,createdTime,modifiedTime,size)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!res.ok) {
      throw new Error('Failed to retrieve files from Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Delete a file from Google Drive (Mandatory user confirmation should be handled prior to calling)
   */
  public static async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok && res.status !== 204) {
      throw new Error('Failed to delete file from Google Drive');
    }
  }
}
