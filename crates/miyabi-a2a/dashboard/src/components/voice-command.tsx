import React from "react";
import { Button, Card, CardBody, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Voice Command 型定義
interface VoiceCommand {
  command: string;
  description: string;
  action: () => void;
  keywords: string[];
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface VoiceCommandProps {
  onCommandExecuted?: (command: string, transcript: string) => void;
  commands?: VoiceCommand[];
}

// ✅ デフォルトコマンド - ダッシュボード操作
const DEFAULT_COMMANDS: VoiceCommand[] = [
  {
    command: "show_all_agents",
    description: "すべてのAgentを表示",
    keywords: ["すべて", "全部", "all", "show all"],
    action: () => {
      // フィルターをリセット
      const allButton = document.querySelector('[aria-label="All agents"]');
      if (allButton) (allButton as HTMLElement).click();
    },
  },
  {
    command: "show_coding_agents",
    description: "Coding Agentを表示",
    keywords: ["コーディング", "coding", "プログラミング", "開発"],
    action: () => {
      const codingButton = document.querySelector('[aria-label="Coding agents"]');
      if (codingButton) (codingButton as HTMLElement).click();
    },
  },
  {
    command: "show_business_agents",
    description: "Business Agentを表示",
    keywords: ["ビジネス", "business", "営業", "マーケティング"],
    action: () => {
      const businessButton = document.querySelector('[aria-label="Business agents"]');
      if (businessButton) (businessButton as HTMLElement).click();
    },
  },
  {
    command: "show_active",
    description: "アクティブなAgentのみ表示",
    keywords: ["アクティブ", "active", "動いている", "稼働中"],
    action: () => {
      const activeButton = document.querySelector('[aria-label="Active agents"]');
      if (activeButton) (activeButton as HTMLElement).click();
    },
  },
  {
    command: "reload",
    description: "ページをリロード",
    keywords: ["リロード", "reload", "更新", "refresh"],
    action: () => {
      window.location.reload();
    },
  },
];

// ✅ VoiceCommand コンポーネント
export const VoiceCommand: React.FC<VoiceCommandProps> = ({
  onCommandExecuted,
  commands = DEFAULT_COMMANDS,
}) => {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [isSupported, setIsSupported] = React.useState(true);
  const [lastCommand, setLastCommand] = React.useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  // ✅ ブラウザサポートチェック
  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn("Web Speech API is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ja-JP"; // 日本語認識

    // ✅ 認識結果ハンドラー
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcriptText = lastResult[0].transcript.toLowerCase();

      setTranscript(transcriptText);

      // ✅ 最終結果のみコマンド判定
      if (lastResult.isFinal) {
        console.log("Final transcript:", transcriptText);
        handleCommand(transcriptText);
      }
    };

    // ✅ エラーハンドラー
    recognition.onerror = (event: Event) => {
      console.error("Speech recognition error:", event);
      setIsListening(false);
    };

    // ✅ 終了ハンドラー
    recognition.onend = () => {
      setIsListening(false);
      setTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [commands]);

  // ✅ コマンド判定・実行
  const handleCommand = (transcript: string) => {
    const matchedCommand = commands.find((cmd) =>
      cmd.keywords.some((keyword) => transcript.includes(keyword))
    );

    if (matchedCommand) {
      console.log("Matched command:", matchedCommand.command);
      setLastCommand(matchedCommand.description);
      matchedCommand.action();

      if (onCommandExecuted) {
        onCommandExecuted(matchedCommand.command, transcript);
      }

      // ✅ 3秒後にクリア
      setTimeout(() => {
        setLastCommand(null);
      }, 3000);
    } else {
      console.log("No matching command for:", transcript);
    }
  };

  // ✅ 音声認識開始
  const startListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log("Voice recognition started");
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
    }
  };

  // ✅ 音声認識停止
  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript("");
      console.log("Voice recognition stopped");
    } catch (error) {
      console.error("Failed to stop voice recognition:", error);
    }
  };

  // ✅ ヘルプモーダル
  const openHelpModal = () => {
    setIsHelpModalOpen(true);
  };

  if (!isSupported) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:mic-off" className="text-2xl text-red-500" />
            <div>
              <p className="font-semibold text-sm">Web Speech API not supported</p>
              <p className="text-xs text-gray-600">このブラウザは音声認識をサポートしていません</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* ✅ VoiceCommand UI */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Last Command Notification */}
        <AnimatePresence>
          {lastCommand && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-l-4 border-l-green-500 shadow-lg">
                <CardBody className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:check-circle" className="text-green-500" />
                    <span className="text-sm font-medium">{lastCommand}</span>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript Display */}
        <AnimatePresence>
          {isListening && transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-l-4 border-l-blue-500 shadow-lg max-w-xs">
                <CardBody className="p-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Icon icon="lucide:mic" className="text-blue-500" />
                    </motion.div>
                    <span className="text-sm">{transcript}</span>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {/* Help Button */}
          <Button
            isIconOnly
            color="default"
            variant="flat"
            onPress={openHelpModal}
            className="shadow-lg"
          >
            <Icon icon="lucide:help-circle" className="text-xl" />
          </Button>

          {/* Mic Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              isIconOnly
              color={isListening ? "danger" : "primary"}
              onPress={isListening ? stopListening : startListening}
              className="shadow-lg w-14 h-14"
            >
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Icon icon="lucide:mic-off" className="text-2xl" />
                </motion.div>
              ) : (
                <Icon icon="lucide:mic" className="text-2xl" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ✅ Help Modal */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Icon icon="lucide:mic" className="text-2xl text-primary" />
                <h2 className="text-xl font-bold">音声コマンド一覧</h2>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">使い方</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                      <li>マイクボタンをクリックして音声認識を開始</li>
                      <li>コマンドを話す（日本語または英語）</li>
                      <li>自動的にコマンドが実行されます</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">コマンド一覧</h3>
                    <div className="space-y-3">
                      {commands.map((cmd, index) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                          <CardBody className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Icon icon="lucide:chevron-right" className="text-primary" />
                                <span className="font-semibold text-sm">{cmd.description}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 ml-6">
                                {cmd.keywords.map((keyword, i) => (
                                  <Chip key={i} size="sm" variant="flat" color="primary">
                                    {keyword}
                                  </Chip>
                                ))}
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">例</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• 「すべてのエージェントを表示して」</p>
                      <p>• 「コーディングエージェントを見せて」</p>
                      <p>• 「アクティブなエージェントだけ表示」</p>
                      <p>• 「ページをリロード」</p>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  閉じる
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
