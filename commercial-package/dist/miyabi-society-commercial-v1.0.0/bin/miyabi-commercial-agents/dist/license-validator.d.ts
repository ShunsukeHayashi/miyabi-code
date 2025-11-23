#!/usr/bin/env node
/**
 * Miyabi Commercial License Validator
 * 商用ライセンス検証システム（完全保護版）
 */
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
export declare class LicenseValidator {
    private licenseKey;
    private machineId;
    constructor(licenseKey?: string);
    /**
     * マシン固有ID生成（ハードウェアバインディング）
     */
    private generateMachineId;
    /**
     * ライセンスキー形式検証
     */
    private validateFormat;
    /**
     * ライセンスキーのチェックサム検証（独自アルゴリズム）
     */
    private validateChecksum;
    /**
     * シークレットソルト（バイナリ内に埋め込み）
     */
    private getSecretSalt;
    /**
     * オンラインライセンス検証（オプション）
     */
    private validateOnline;
    /**
     * オフラインライセンス検証
     */
    private validateOffline;
    /**
     * ライセンスTier取得
     */
    getTier(): 'STARTER' | 'PRO' | 'ENTERPRISE' | null;
    /**
     * メインライセンス検証
     */
    validate(): Promise<LicenseInfo>;
    /**
     * 機能制限チェック（Tierによる制限）
     */
    canUseFeature(feature: string): boolean;
}
/**
 * アンチデバッグ保護（バイナリ化時に有効）
 */
export declare class AntiDebug {
    static check(): void;
    private static isDebuggerAttached;
}
//# sourceMappingURL=license-validator.d.ts.map