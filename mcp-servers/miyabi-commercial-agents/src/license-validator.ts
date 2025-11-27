#!/usr/bin/env node
/**
 * Miyabi Commercial License Validator
 * 商用ライセンス検証システム（完全保護版）
 */

import crypto from 'crypto';
import os from 'os';

export interface LicenseInfo {
  key: string;
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  valid: boolean;
  expiresAt?: string;
  machineId?: string;
}

/**
 * ライセンス検証クラス（バイナリ化時に完全保護）
 */
export class LicenseValidator {
  private licenseKey: string;
  private machineId: string;

  constructor(licenseKey?: string) {
    this.licenseKey = licenseKey || process.env.MIYABI_LICENSE_KEY || '';
    this.machineId = this.generateMachineId();
  }

  /**
   * マシン固有ID生成（ハードウェアバインディング）
   */
  private generateMachineId(): string {
    const machineInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      // cpus: os.cpus()[0]?.model || 'unknown',
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(machineInfo))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * ライセンスキー形式検証
   */
  private validateFormat(key: string): boolean {
    // フォーマット: MIYABI-COMMERCIAL-{TIER}-{HASH}
    const pattern = /^MIYABI-COMMERCIAL-(STARTER|PRO|ENTERPRISE)-[A-Z0-9]{20}$/;
    return pattern.test(key);
  }

  /**
   * ライセンスキーのチェックサム検証（独自アルゴリズム）
   */
  private validateChecksum(key: string): boolean {
    // 機密アルゴリズム（バイナリ化時に保護）
    const parts = key.split('-');
    if (parts.length !== 4) return false;

    const hash = parts[3];
    const tier = parts[2];

    // チェックサム生成（独自ロジック）
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${tier}-${this.getSecretSalt()}`)
      .digest('hex')
      .toUpperCase()
      .substring(0, 20);

    // 部分一致検証（完全一致は避ける）
    return hash.substring(0, 4) === expectedHash.substring(0, 4);
  }

  /**
   * シークレットソルト（バイナリ内に埋め込み）
   */
  private getSecretSalt(): string {
    // 本番環境では環境変数や暗号化された値を使用
    return process.env.MIYABI_SECRET_SALT || 'MIYABI_DEFAULT_SALT_2025';
  }

  /**
   * オンラインライセンス検証（オプション）
   */
  private async validateOnline(key: string): Promise<boolean> {
    try {
      // 本番環境ではライセンスサーバーに問い合わせ
      const apiUrl = process.env.MIYABI_LICENSE_API || 'https://api.miyabi.tech/validate';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: key,
          machine_id: this.machineId,
          product: 'miyabi-commercial-agents',
          version: '1.0.0',
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result: any = await response.json();
      return result.valid === true;
    } catch (error) {
      // オンライン検証失敗時はオフライン検証にフォールバック
      console.error('Online validation failed, using offline validation');
      return this.validateOffline(key);
    }
  }

  /**
   * オフラインライセンス検証
   */
  private validateOffline(key: string): boolean {
    return this.validateFormat(key) && this.validateChecksum(key);
  }

  /**
   * ライセンスTier取得
   */
  getTier(): 'STARTER' | 'PRO' | 'ENTERPRISE' | null {
    if (!this.licenseKey) return null;

    const parts = this.licenseKey.split('-');
    if (parts.length !== 4) return null;

    const tier = parts[2];
    if (['STARTER', 'PRO', 'ENTERPRISE'].includes(tier)) {
      return tier as 'STARTER' | 'PRO' | 'ENTERPRISE';
    }

    return null;
  }

  /**
   * メインライセンス検証
   */
  async validate(): Promise<LicenseInfo> {
    if (!this.licenseKey) {
      throw new Error('MIYABI_LICENSE_KEY is required for commercial agents');
    }

    // フォーマット検証
    if (!this.validateFormat(this.licenseKey)) {
      throw new Error('Invalid license key format');
    }

    // オンライン検証を試行
    const isValid = await this.validateOnline(this.licenseKey);

    if (!isValid) {
      throw new Error('License validation failed');
    }

    const tier = this.getTier();
    if (!tier) {
      throw new Error('Invalid license tier');
    }

    return {
      key: this.licenseKey,
      tier,
      valid: true,
      machineId: this.machineId,
    };
  }

  /**
   * 機能制限チェック（Tierによる制限）
   */
  canUseFeature(feature: string): boolean {
    const tier = this.getTier();
    if (!tier) return false;

    const featureMatrix: Record<string, string[]> = {
      // STARTER: 基本機能のみ
      'basic_sns_strategy': ['STARTER', 'PRO', 'ENTERPRISE'],
      'basic_content_creation': ['STARTER', 'PRO', 'ENTERPRISE'],
      'x_post_generation': ['STARTER', 'PRO', 'ENTERPRISE'],
      'x_account_analysis': ['STARTER', 'PRO', 'ENTERPRISE'],

      // PRO: 高度な機能
      'advanced_analytics': ['PRO', 'ENTERPRISE'],
      'youtube_optimization': ['PRO', 'ENTERPRISE'],
      'marketing_automation': ['PRO', 'ENTERPRISE'],
      'x_posting': ['PRO', 'ENTERPRISE'],  // 実際の投稿はPRO以上

      // ENTERPRISE: 全機能
      'crm_integration': ['ENTERPRISE'],
      'custom_algorithms': ['ENTERPRISE'],
      'api_access': ['ENTERPRISE'],
    };

    const allowedTiers = featureMatrix[feature] || [];
    return allowedTiers.includes(tier);
  }
}

/**
 * アンチデバッグ保護（バイナリ化時に有効）
 */
export class AntiDebug {
  static check(): void {
    // デバッガー検出
    if (this.isDebuggerAttached()) {
      console.error('Debugger detected. Exiting.');
      process.exit(1);
    }

    // 定期チェック（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        if (this.isDebuggerAttached()) {
          process.exit(1);
        }
      }, 5000);
    }
  }

  private static isDebuggerAttached(): boolean {
    // V8 インスペクター検出
    const v8Flags = process.execArgv.join(' ');
    return /--inspect|--debug/.test(v8Flags);
  }
}
