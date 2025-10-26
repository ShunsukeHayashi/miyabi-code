# End User License Agreement (EULA)

**Miyabi CLI - End User License Agreement**

**Version**: 1.0.0
**Effective Date**: 2025-10-20
**Last Updated**: 2025-10-20

---

## ⚠️ IMPORTANT NOTICE

**PLEASE READ THIS END USER LICENSE AGREEMENT ("AGREEMENT") CAREFULLY BEFORE USING MIYABI CLI.**

By installing, downloading, accessing, or using Miyabi CLI (the "Software"), you agree to be bound by the terms of this Agreement. If you do not agree to the terms of this Agreement, do not install, download, access, or use the Software.

---

## 1. Definitions

- **"Software"**: Miyabi CLI binary executable and associated documentation
- **"Licensor"**: Shunsuke Hayashi, the copyright holder and developer of Miyabi
- **"You"** or **"User"**: The individual or legal entity using the Software
- **"Source Code"**: The human-readable form of software from which the Software is compiled
- **"Binary"**: The machine-executable form of the Software distributed by Licensor

---

## 2. License Grant

### 2.1 Binary License

Subject to your compliance with this Agreement, Licensor grants you a **non-exclusive, non-transferable, revocable license** to:

- Install and use the Software binary on your computing devices
- Use the Software for personal, educational, or commercial purposes
- Distribute unmodified copies of the Software binary with attribution

This binary is licensed under **Apache License 2.0** for distribution and usage rights. The full Apache 2.0 license text is available at:
- https://www.apache.org/licenses/LICENSE-2.0
- `/docs/LICENSE` in the public release repository

### 2.2 Proprietary Source Code

**THE SOURCE CODE OF MIYABI CLI IS PROPRIETARY AND NOT INCLUDED IN THIS DISTRIBUTION.**

You acknowledge and agree that:
- The Source Code is confidential and proprietary to Licensor
- You do NOT receive any rights to the Source Code under this Agreement
- The Source Code is protected by copyright, trade secret, and other intellectual property laws
- Unauthorized access, use, or distribution of the Source Code is strictly prohibited

---

## 3. Restrictions

You **MAY NOT**:

### 3.1 Reverse Engineering
- Reverse engineer, decompile, disassemble, or attempt to derive the Source Code from the Software binary
- Use any tools, techniques, or methods to extract, recover, or reconstruct the Source Code
- Create derivative works based on reverse-engineered Source Code

### 3.2 Modification and Distribution
- Modify, adapt, translate, or create derivative works of the Software binary
- Remove, alter, or obscure any copyright, trademark, or proprietary notices in the Software
- Distribute modified versions of the Software

### 3.3 Redistribution with Modifications
- Redistribute the Software with modifications or additions
- Bundle the Software with other software that modifies its behavior without explicit permission

### 3.4 Misuse
- Use the Software for any unlawful purpose or in violation of applicable laws
- Use the Software to transmit malware, viruses, or malicious code
- Interfere with or disrupt the integrity or performance of the Software

---

## 4. Data Collection and Privacy

### 4.1 Opt-In Consent

**DATA COLLECTION REQUIRES YOUR EXPLICIT CONSENT.**

The Software may collect the following data **ONLY IF YOU OPT IN**:

#### 4.1.1 Mandatory Data (Local Only)
The following data is generated and stored **locally on your device only** and is NOT transmitted without consent:
- Anonymous user ID (UUID v4)
- EULA version and acceptance timestamp
- Installation date and time

#### 4.1.2 Optional Data (Requires Opt-In)
The following data is collected **ONLY with your explicit consent**:

**User Registration (Optional)**:
- Email address (for product updates and notifications)
- Consent preferences (marketing, analytics)

**Anonymous Usage Analytics (Optional)**:
- Command usage frequency (e.g., "miyabi init")
- Error types and frequencies
- Operating system version and architecture
- Software version

**What We DO NOT Collect**:
- ❌ Project names or code content
- ❌ Personal information (beyond optional email)
- ❌ File paths or directory structures
- ❌ Environment variables
- ❌ Any personally identifiable information (PII) without consent

### 4.2 Consent Management

You can manage your data collection preferences at any time:

```bash
# View current consent settings
miyabi config show

# Enable/disable analytics
miyabi config analytics --enable
miyabi config analytics --disable

# Delete all local data
miyabi config reset

# Request account deletion (if registered)
miyabi account delete
```

### 4.3 GDPR and CCPA Compliance

Licensor complies with the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA). You have the right to:

- **Access**: Request a copy of your data
- **Rectification**: Correct inaccurate data
- **Erasure**: Delete your data ("right to be forgotten")
- **Objection**: Object to data processing
- **Portability**: Receive your data in a machine-readable format

To exercise these rights, contact: **privacy@miyabi.dev**

### 4.4 Third-Party Services

The Software may integrate with third-party services:
- **GitHub API**: For repository management (requires your GitHub token)
- **Anthropic API**: For AI-powered agents (requires your API key)

Your use of these services is governed by their respective terms of service and privacy policies:
- GitHub: https://docs.github.com/en/site-policy/privacy-policies
- Anthropic: https://www.anthropic.com/legal/privacy

**Licensor does NOT have access to your API keys or GitHub tokens.**

---

## 5. Intellectual Property

### 5.1 Ownership

Licensor retains all right, title, and interest in and to:
- The Software (binary and Source Code)
- All intellectual property rights, including copyrights, patents, trademarks, and trade secrets
- All documentation, branding, and related materials

### 5.2 Trademarks

**"Miyabi"** and associated logos are trademarks of Licensor. You may not use these trademarks without prior written permission, except as necessary to comply with attribution requirements.

### 5.3 Open Source Components

The Software may include open source components licensed under Apache 2.0, MIT, or other permissive licenses. These components retain their original licenses. A full list of dependencies is available in the `NOTICE` file.

---

## 6. Disclaimer of Warranties

**THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.**

Licensor disclaims all warranties, express or implied, including but not limited to:
- Merchantability
- Fitness for a particular purpose
- Non-infringement
- Accuracy or reliability of results
- Compatibility with your systems

**YOU USE THE SOFTWARE AT YOUR OWN RISK.**

---

## 7. Limitation of Liability

**TO THE MAXIMUM EXTENT PERMITTED BY LAW, LICENSOR SHALL NOT BE LIABLE FOR:**

- Any indirect, incidental, consequential, special, or punitive damages
- Loss of profits, revenue, data, or use
- Business interruption or system failures
- Costs of procurement of substitute services

**IN NO EVENT SHALL LICENSOR'S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID FOR THE SOFTWARE (IF ANY).**

---

## 8. Termination

### 8.1 Termination by You

You may terminate this Agreement at any time by:
- Uninstalling the Software from all your devices
- Deleting all copies of the Software in your possession
- Ceasing all use of the Software

### 8.2 Termination by Licensor

Licensor may terminate this Agreement immediately if:
- You breach any term of this Agreement
- You engage in unauthorized reverse engineering or Source Code access
- You use the Software for unlawful purposes

### 8.3 Effect of Termination

Upon termination:
- Your license to use the Software is immediately revoked
- You must uninstall and delete all copies of the Software
- Sections 3 (Restrictions), 5 (Intellectual Property), 6 (Disclaimer), 7 (Limitation of Liability), and 9 (Governing Law) survive termination

---

## 9. Governing Law and Jurisdiction

This Agreement is governed by the laws of **Japan**, without regard to its conflict of laws principles.

Any disputes arising from this Agreement shall be resolved in the courts of **Tokyo, Japan**.

---

## 10. Updates to this Agreement

Licensor reserves the right to update this Agreement at any time. Changes will be communicated through:
- Software update notifications
- Email (if you have registered)
- Public notice on the project repository

**Continued use of the Software after changes constitutes acceptance of the updated Agreement.**

You can view the current EULA version at any time:
```bash
miyabi eula --show
```

---

## 11. Contact Information

For questions, concerns, or requests regarding this Agreement, contact:

**Email**: legal@miyabi.dev
**Privacy Requests**: privacy@miyabi.dev
**Security Issues**: security@miyabi.dev
**General Inquiries**: support@miyabi.dev

**Repository**: https://github.com/ShunsukeHayashi/Miyabi
**Discord Community**: https://discord.gg/Urx8547abS

---

## 12. Entire Agreement

This Agreement constitutes the entire agreement between you and Licensor regarding the Software and supersedes all prior agreements, understandings, or communications.

If any provision of this Agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.

---

## 13. Acceptance

By clicking "I Accept," typing "yes," or otherwise using the Software, you acknowledge that:

1. ✅ You have read and understood this Agreement
2. ✅ You agree to be bound by its terms and conditions
3. ✅ You understand that the Source Code is proprietary and not included
4. ✅ You will not attempt to reverse engineer or access the Source Code
5. ✅ You consent to the data collection practices described above (with opt-in)

**IF YOU DO NOT ACCEPT THESE TERMS, YOU MAY NOT USE THE SOFTWARE.**

---

## 14. Legal Review Notice

⚖️ **IMPORTANT FOR LICENSOR**:

This EULA is a **draft template** and should be reviewed by a qualified legal professional before production use. Considerations include:

- Jurisdiction-specific regulations (GDPR, CCPA, PIPEDA, etc.)
- Export control regulations (if applicable)
- Industry-specific compliance requirements
- Insurance and liability coverage
- Enforceability of terms in your jurisdiction

**Recommended**: Consult with a lawyer specializing in software licensing and intellectual property law.

---

**© 2025 Shunsuke Hayashi. All rights reserved.**

**Version**: 1.0.0
**Last Updated**: 2025-10-20
**EULA ID**: MIYABI-EULA-20251020-v1
