'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  CirclePlus,
  Clock3,
  FileText,
  Image as ImageIcon,
  Images,
  Layers as LayersIcon,
  MessageCircle,
  Mic2,
  Minus,
  Plus,
  SendHorizonal,
  X,
} from 'lucide-react';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1200;

type SelectedImage = {
  name: string;
  url: string;
  role?: ImageRole;
};

type RecognitionMode = 'questions_only' | 'same_image_answer' | 'separate_answer';
type ImageRole = 'question' | 'answer';

const assignments = [
  {
    date: '2026-06-10作业',
    name: '乡土中国：《无为政治》《长老统治》配套练...',
    tags: ['课前'],
  },
  {
    date: '2026-06-03作业',
    name: '高一数学第一章 集合练习',
    tags: ['课中', '学生自批'],
  },
  {
    date: '2026-05-08作业',
    name: '2026年4月20日19时组卷',
    tags: ['课中', '学生自批'],
  },
  {
    date: '2026-05-02作业',
    name: '阶段同步练习',
    tags: ['课后'],
  },
];

const subjects = [
  '小学语文',
  '小学数学',
  '小学英语',
  '初中语文',
  '初中英语',
  '高中语文',
  '高中数学',
  '高中英语',
  '高中物理',
  '高中化学',
  '高中生物',
  '高中政治',
  '高中历史',
  '高中地理',
];

function useCanvasScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const nextScale = Math.min(
        window.innerWidth / CANVAS_WIDTH,
        window.innerHeight / CANVAS_HEIGHT,
        1,
      );
      setScale(nextScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return scale;
}

function TrialFileIcon() {
  return (
    <div className="relative h-[96px] w-[82px]">
      <FileText className="absolute left-0 top-0 h-[96px] w-[82px] stroke-[1.4] text-slate-200" />
      <div className="absolute bottom-[14px] left-[29px] rounded-[5px] bg-[#10b981] px-[9px] py-[5px] text-[18px] font-semibold leading-none text-white">
        试卷
      </div>
    </div>
  );
}

function AssignmentBlock({
  date,
  name,
  tags,
  top,
}: {
  date: string;
  name: string;
  tags: string[];
  top: number;
}) {
  return (
    <section
      className="absolute left-[31px] h-[294px] w-[935px] rounded-[2px] bg-white"
      style={{ top }}
    >
      <div className="absolute left-[29px] top-[27px] rounded-full bg-[#b9b9b9] px-[22px] py-[8px] text-[22px] font-medium leading-none text-white">
        已结束
      </div>
      <h2 className="absolute left-[186px] top-[28px] text-[31px] font-bold leading-none text-[#202124]">
        {date}
      </h2>
      <div className="absolute left-[30px] top-[96px] h-[169px] w-[900px] rounded-[7px] border border-[#ececec] bg-white">
        <div className="absolute left-[42px] top-[34px]">
          <TrialFileIcon />
        </div>
        <div className="absolute left-[153px] top-[36px] flex max-w-[640px] items-center gap-[16px]">
          <p className="truncate text-[29px] leading-none text-[#505050]">{name}</p>
          {tags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full bg-[#f1f1f1] px-[22px] py-[10px] text-[21px] leading-none text-[#606060]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute left-[153px] top-[106px] flex items-center gap-[32px] text-[24px] leading-none text-[#868686]">
          <span>
            提交人数： <strong className="font-medium text-[#45c9a6]">1/71</strong>
          </span>
          <span>
            批改人数： <strong className="font-medium text-[#45c9a6]">0/1</strong>
          </span>
          <span>
            正确率： <strong className="font-medium text-[#555]">0%</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

function RobotMark() {
  return (
    <div className="relative h-[62px] w-[64px]">
      <img
        alt="AI小乐"
        className="h-full w-full object-contain"
        src="/ai-mascot.jpg"
      />
    </div>
  );
}

function QuickButton({
  children,
  top,
  onClick,
}: {
  children: React.ReactNode;
  top: number;
  onClick?: () => void;
}) {
  return (
    <button
      className="absolute left-[88px] h-[60px] rounded-[8px] border border-[#dcdcdc] bg-white px-[14px] text-left text-[24px] leading-none text-[#2f2f2f] active:bg-[#f6f6f6]"
      onClick={onClick}
      style={{ top }}
      type="button"
    >
      {children}
    </button>
  );
}

function HomeworkPanel() {
  return (
    <div className="absolute left-0 top-0 h-[1200px] w-[966px] overflow-hidden bg-[#f4f4f4]">
      <div className="absolute left-0 top-0 h-[107px] w-[966px] bg-[#59ce91]">
        <div className="absolute left-[22px] top-[8px] flex items-center gap-[14px] text-[23px] font-semibold text-white">
          <span>4:39</span>
          <ImageIcon className="h-[20px] w-[20px] fill-white/90 stroke-white/90" />
        </div>
        <div className="absolute left-[42px] top-[56px] flex items-center gap-[26px] text-[29px] font-medium text-white/90">
          <ChevronLeft className="h-[31px] w-[31px]" />
          <span>返回</span>
          <span>关闭</span>
        </div>
        <div className="absolute right-[3px] top-[57px] text-[31px] font-medium text-white/80">
          作业
        </div>
      </div>

      <div className="absolute left-0 top-[107px] h-[109px] w-[966px] bg-white">
        <div className="absolute right-[65px] top-[29px] text-[30px] font-bold leading-none text-[#202124]">
          待批改(50)
        </div>
        <div className="absolute right-[66px] top-[79px] h-[5px] w-[58px] rounded-full bg-[#58cf9a]" />
      </div>

      {assignments.map((assignment, index) => (
        <AssignmentBlock
          key={assignment.date}
          {...assignment}
          top={216 + index * 316}
        />
      ))}

      <div className="absolute bottom-[48px] left-[792px] h-[83px] w-[232px] rounded-full bg-[#58d297] text-center text-[34px] font-medium leading-[83px] text-white">
        布置
      </div>
    </div>
  );
}

function SelectedImageCard({ image }: { image: SelectedImage }) {
  const roleLabel = image.role === 'question' ? '题目' : image.role === 'answer' ? '答案' : '图片';
  const roleClass = image.role === 'answer' ? 'bg-[#5d82f3]' : image.role === 'question' ? 'bg-[#10b981]' : 'bg-[#ff5f60]';

  return (
    <div className="flex h-[86px] w-[330px] items-center gap-[14px] rounded-[10px] border border-[#e8e8e8] bg-white px-[14px]">
      <img
        alt=""
        className="h-[58px] w-[58px] shrink-0 rounded-[6px] object-cover"
        src={image.url}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[21px] leading-none text-[#303030]">
          {image.name}
        </div>
        <div className={`mt-[10px] rounded-[4px] px-[7px] py-[4px] text-[15px] font-medium leading-none text-white w-fit ${roleClass}`}>
          {roleLabel}
        </div>
      </div>
    </div>
  );
}

function SelectedImagesPanel({
  images,
  onSubjectSelect,
  selectedSubject,
}: {
  images: SelectedImage[];
  onSubjectSelect: (subject: string) => void;
  selectedSubject: string;
}) {
  return (
    <>
      <div className="absolute right-[27px] top-[285px] text-[24px] leading-none text-[#202124]">
        帮我识别以下资料
      </div>
      <div className="absolute right-[31px] top-[353px] w-[348px] rounded-[10px] bg-[#f7f8fb] p-[14px]">
        <div className="grid gap-[14px]">
          {images.slice(0, 3).map((image) => (
            <SelectedImageCard key={image.url} image={image} />
          ))}
        </div>
        {images.length > 3 ? (
          <div className="mt-[12px] text-right text-[20px] leading-none text-[#8a8a8a]">
            另有 {images.length - 3} 张图片
          </div>
        ) : null}
      </div>

      <div className="absolute left-[22px] top-[634px]">
        <RobotMark />
      </div>
      <div className="absolute left-[106px] top-[646px] text-[24px] leading-none text-[#303030]">
        请确认这次识别资料的学科
      </div>
      <div className="absolute left-[88px] top-[706px] grid w-[780px] grid-cols-4 gap-[16px]">
        {subjects.map((subject) => (
          <button
            key={subject}
            className={`h-[58px] rounded-[8px] border text-[22px] leading-none active:bg-[#f6f6f6] ${
              selectedSubject === subject
                ? 'border-[#58cf9a] bg-[#eefaf4] text-[#20a874]'
                : 'border-[#dedede] bg-white text-[#333]'
            }`}
            onClick={() => onSubjectSelect(subject)}
            type="button"
          >
            {subject}
          </button>
        ))}
      </div>
    </>
  );
}

function AiPanel({
  onSubjectSelect,
  selectedImages,
  selectedSubject,
  onOpenUpload,
}: {
  onSubjectSelect: (subject: string) => void;
  selectedImages: SelectedImage[];
  selectedSubject: string;
  onOpenUpload: () => void;
}) {
  const hasSelectedImages = selectedImages.length > 0;

  return (
    <aside className="absolute left-[966px] top-0 h-[1200px] w-[954px] rounded-l-[12px] bg-white shadow-[-12px_0_24px_rgba(0,0,0,0.13)]">
      <header className="absolute left-0 top-0 h-[142px] w-full">
        <div className="absolute left-[28px] top-[63px] text-[40px] font-black italic leading-none text-[#242424]">
          AI小乐
        </div>
        <div className="absolute right-[24px] top-[72px] flex items-center gap-[30px]">
          <CirclePlus className="h-[29px] w-[29px] text-[#63c7a2]" />
          <Clock3 className="h-[29px] w-[29px] text-[#222]" />
          <Minus className="h-[31px] w-[31px] stroke-[4] text-[#222]" />
        </div>
      </header>

      <div className="absolute left-[22px] top-[150px]">
        <RobotMark />
      </div>
      <div className="absolute left-[106px] top-[144px] h-[108px] w-[617px] rounded-[8px] bg-[#f7f8fb] px-[22px] py-[22px]">
        <div className="text-[28px] font-bold leading-none text-[#282828]">Hi！我是AI小乐！</div>
        <div className="mt-[15px] text-[23px] leading-none text-[#333]">
          我能够帮您出题、布置作业，请把您的任务交给我吧！
        </div>
      </div>

      {hasSelectedImages ? (
        <SelectedImagesPanel
          images={selectedImages}
          onSubjectSelect={onSubjectSelect}
          selectedSubject={selectedSubject}
        />
      ) : (
        <>
          <QuickButton top={279}>帮我布置试卷作业</QuickButton>
          <QuickButton top={357} onClick={onOpenUpload}>
            帮我识别作业资料
          </QuickButton>
          <QuickButton top={430}>帮我布置听力作业</QuickButton>
        </>
      )}

      <div className="absolute bottom-[24px] left-[26px] h-[155px] w-[902px] rounded-[16px] border border-[#d3d3d3] bg-[#f4f4f4] text-[#b9b9b9] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="absolute left-[20px] top-[22px] flex items-center gap-[18px]">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-[2px] border-[#222] bg-white opacity-45">
            <Mic2 className="h-[24px] w-[24px] text-[#222]" />
          </div>
          <span className="text-[26px] leading-none text-[#b8b8b8]">向我提问或提出要求</span>
        </div>
        <div className="absolute left-[24px] bottom-[18px] flex h-[44px] items-center rounded-[5px] border border-[#dfdfdf] bg-[#eeeeee] px-[10px] text-[22px] leading-none text-[#6f6f6f] opacity-70">
          <MessageCircle className="mr-[5px] h-[24px] w-[24px]" />
          深度思考（R1）
        </div>
        <button
          className="absolute bottom-[21px] right-[82px] flex h-[42px] w-[42px] items-center justify-center rounded-full border-[3px] border-[#777] bg-[#f1f1f1] text-[#777]"
          disabled
          type="button"
        >
          <Plus className="h-[28px] w-[28px]" />
        </button>
        <button
          className="absolute bottom-[19px] right-[19px] flex h-[45px] w-[45px] items-center justify-center rounded-[8px] bg-[#c9c9c9] text-white"
          disabled
          type="button"
        >
          <SendHorizonal className="h-[28px] w-[28px] fill-white stroke-white" />
        </button>
      </div>
    </aside>
  );
}

const recognitionModes: {
  id: RecognitionMode;
  title: string;
  badge?: string;
  description: string;
}[] = [
  {
    id: 'questions_only',
    title: '仅识别题目',
    description: '适用于只包含题目、不包含答案解析的资料',
  },
  {
    id: 'same_image_answer',
    title: '题目+答案',
    badge: '同图片',
    description: '适用于题目与答案解析紧挨着出现的资料',
  },
  {
    id: 'separate_answer',
    title: '题目+答案',
    badge: '不同图片',
    description: '适用于题目与答案解析分开拍摄的资料',
  },
];

function DiagramLine({
  tone = 'question',
  width = 'w-full',
}: {
  tone?: 'question' | 'answer' | 'muted';
  width?: string;
}) {
  const color =
    tone === 'question'
      ? 'bg-[#a9ead8]'
      : tone === 'answer'
        ? 'bg-[#adc5ff]'
        : 'bg-[#d9dde3]';

  return <div className={`h-[10px] rounded-full ${color} ${width}`} />;
}

function DiagramTag({
  children,
  tone = 'question',
}: {
  children: React.ReactNode;
  tone?: 'question' | 'answer';
}) {
  const toneClass =
    tone === 'question'
      ? 'bg-[#4fc6b1] text-white'
      : 'bg-[#6f94f7] text-white';

  return (
    <div className={`inline-flex h-[30px] items-center rounded-[3px] px-[9px] text-[14px] font-medium leading-none ${toneClass}`}>
      {children}
    </div>
  );
}

function SourcePageFrame({
  title = '资料页',
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative h-full rounded-[10px] border border-[#d7dde3] bg-white shadow-[0_2px_8px_rgba(31,44,58,0.08)] ${className}`}>
      <div className="absolute left-0 top-0 flex h-[50px] w-full items-center justify-center text-[18px] leading-none text-[#4b5563]">
        {title}
      </div>
      <div className="absolute left-[20px] right-[20px] top-[60px] bottom-[18px]">
        {children}
      </div>
    </div>
  );
}

function ResultPreview({ rich }: { rich: boolean }) {
  if (!rich) {
    return (
      <SourcePageFrame title="识别结果">
        <div className="space-y-[26px] pt-[4px]">
          {[1, 2, 3].map((index) => (
            <div key={index}>
              <div className="mb-[10px] text-[16px] font-medium leading-none text-[#475569]">
                题{index}
              </div>
              <div className="space-y-[9px]">
                <DiagramLine width="w-full" />
                <DiagramLine width="w-[74%]" />
              </div>
            </div>
          ))}
        </div>
      </SourcePageFrame>
    );
  }

  return (
    <SourcePageFrame title="识别结果">
      <div className="space-y-[20px] pt-[2px]">
        <div>
          <div className="mb-[10px] text-[16px] font-medium leading-none text-[#475569]">题1</div>
          <div className="space-y-[9px]">
            <DiagramLine />
            <DiagramLine width="w-[78%]" />
            <DiagramLine width="w-[58%]" />
          </div>
        </div>
        <div>
          <div className="mb-[10px] text-[15px] leading-none text-[#475569]">答案：</div>
          <div className="space-y-[9px]">
            <DiagramLine tone="answer" />
            <DiagramLine tone="answer" width="w-[62%]" />
          </div>
        </div>
        <div>
          <div className="mb-[10px] text-[15px] leading-none text-[#475569]">解析：</div>
          <div className="space-y-[9px]">
            <DiagramLine tone="answer" />
            <DiagramLine tone="answer" width="w-[68%]" />
          </div>
        </div>
      </div>
    </SourcePageFrame>
  );
}

function QuestionBlock({ label, top }: { label: string; top: number }) {
  return (
    <div
      className="absolute left-[18px] h-[58px] w-[218px] rounded-[6px] border border-[#68d3c2] bg-[#e8faf5]"
      style={{ top }}
    >
      <div className="absolute -top-[30px] left-0">
        <DiagramTag>{label}</DiagramTag>
      </div>
      <div className="absolute left-[16px] right-[14px] top-[15px] space-y-[9px]">
        <DiagramLine />
        <DiagramLine width="w-[68%]" />
      </div>
    </div>
  );
}

function AdjacentAnswerBlock({ label, top }: { label: string; top: number }) {
  return (
    <div
      className="absolute left-[18px] h-[66px] w-[258px] rounded-[6px] border border-[#68d3c2] bg-[#e8faf5]"
      style={{ top }}
    >
      <div className="absolute -top-[30px] left-0">
        <DiagramTag>{label}</DiagramTag>
      </div>
      <div className="absolute left-[18px] right-[18px] top-[17px] space-y-[9px]">
        <DiagramLine />
        <DiagramLine width="w-[66%]" />
      </div>
      <div className="absolute left-[18px] top-[78px] space-y-[10px]">
        <DiagramLine tone="answer" width="w-[224px]" />
        <DiagramLine tone="answer" width="w-[172px]" />
      </div>
    </div>
  );
}

function CompactQuestionBlock({
  label,
  top,
  tone = 'question',
}: {
  label: string;
  top: number;
  tone?: 'question' | 'answer';
}) {
  const blockClass =
    tone === 'question'
      ? 'border-[#68d3c2] bg-[#e8faf5]'
      : 'border-[#aec3ff] bg-[#eef3ff]';

  return (
    <div
      className={`absolute left-[12px] h-[52px] w-[108px] rounded-[6px] border ${blockClass}`}
      style={{ top }}
    >
      <div className="absolute -top-[26px] left-0">
        <DiagramTag tone={tone}>
          {label}
        </DiagramTag>
      </div>
      <div className="absolute left-[10px] right-[8px] top-[13px] space-y-[8px]">
        <DiagramLine tone={tone} />
        <DiagramLine tone={tone} width="w-[62%]" />
      </div>
    </div>
  );
}

function CompactFileFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full rounded-[10px] border border-[#d7dde3] bg-white shadow-[0_2px_8px_rgba(31,44,58,0.08)]">
      <div className="absolute left-0 top-[18px] w-full text-center text-[15px] leading-none text-[#4b5563]">
        {title}
      </div>
      {children}
    </div>
  );
}

function QuestionOnlyDiagram() {
  return (
    <div className="grid h-full grid-cols-[1.34fr_0.76fr] gap-[18px]">
      <SourcePageFrame>
        <QuestionBlock label="题1" top={42} />
        <QuestionBlock label="题2" top={134} />
        <QuestionBlock label="题3" top={226} />
      </SourcePageFrame>
      <ResultPreview rich={false} />
    </div>
  );
}

function SameFileDiagram() {
  return (
    <div className="grid h-full grid-cols-[1.34fr_0.76fr] gap-[18px]">
      <SourcePageFrame>
        <AdjacentAnswerBlock label="题1+答案/解析" top={42} />
        <AdjacentAnswerBlock label="题2+答案/解析" top={190} />
      </SourcePageFrame>
      <ResultPreview rich />
    </div>
  );
}

function SeparateFileDiagram() {
  return (
    <div className="grid h-full grid-cols-[0.9fr_0.9fr_1.08fr] gap-[14px]">
      <CompactFileFrame title="《试卷题目文件》">
        {[1, 2, 3].map((index, itemIndex) => (
          <CompactQuestionBlock key={index} label={`题${index}`} top={72 + itemIndex * 86} />
        ))}
      </CompactFileFrame>
      <CompactFileFrame title="《试卷答案文件》">
        {[1, 2, 3].map((index, itemIndex) => (
          <CompactQuestionBlock
            key={index}
            label={`题${index}答案解析`}
            tone="answer"
            top={72 + itemIndex * 86}
          />
        ))}
      </CompactFileFrame>
      <ResultPreview rich />
    </div>
  );
}

function ModeDiagram({ mode }: { mode: RecognitionMode }) {
  if (mode === 'questions_only') {
    return <QuestionOnlyDiagram />;
  }

  if (mode === 'same_image_answer') {
    return <SameFileDiagram />;
  }

  return <SeparateFileDiagram />;
}

function RecognitionModeDialog({
  onClose,
  onModeSelect,
}: {
  onClose: () => void;
  onModeSelect: (mode: RecognitionMode) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 bg-[#f0f4f7]">
      <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#e8e8e8] bg-white">
        <button
          aria-label="返回"
          className="absolute left-[34px] top-[26px] flex h-[48px] items-center gap-[8px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f4f4f4]"
          onClick={onClose}
          type="button"
        >
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[30px] font-normal leading-none">识别作业资料</span>
        </button>
      </header>

      <main className="absolute left-0 top-[96px] h-[1002px] w-full">
        <div className="absolute left-0 top-[50px] w-full text-center">
          <h2 className="text-[34px] font-medium leading-none text-[#1f2933]">
            选择识别方式
          </h2>
          <p className="mt-[18px] text-[22px] leading-none text-[#6b7280]">
            建议根据您的资料内容，选择合适的处理流程
          </p>
        </div>

        <div className="absolute left-[44px] top-[190px] grid w-[1832px] grid-cols-3 gap-[24px]">
          {recognitionModes.map((mode) => {
            const iconColor =
              mode.id === 'questions_only'
                ? 'bg-blue-50 text-blue-600'
                : mode.id === 'same_image_answer'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-amber-50 text-amber-600';
            const badgeColor =
              mode.id === 'same_image_answer'
                ? 'bg-[#eaf5ff] text-[#2698ff]'
                : mode.id === 'separate_answer'
                  ? 'bg-[#fff5dc] text-[#f59f22]'
                  : 'bg-blue-50 text-blue-600';
            const Icon =
              mode.id === 'questions_only'
                ? FileText
                : mode.id === 'same_image_answer'
                  ? Images
                  : LayersIcon;

            return (
              <button
                key={mode.id}
                className="group flex h-[600px] cursor-pointer flex-col rounded-[16px] border-2 border-white bg-white px-[34px] pb-[32px] pt-[36px] text-left shadow-[0_12px_34px_rgba(31,44,58,0.10)] transition-all active:scale-[0.995] active:border-[#58cf9a] active:bg-[#f3fbf7]"
                onClick={() => onModeSelect(mode.id)}
                type="button"
              >
                <div className="mb-[30px] flex items-start gap-[18px]">
                  <div className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] ${iconColor}`}>
                    <Icon className="h-[28px] w-[28px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[12px]">
                      <span className="text-[30px] font-bold leading-none text-[#222831]">
                        {mode.title}
                      </span>
                      {mode.badge ? (
                        <span className={`rounded-full px-[12px] py-[6px] text-[18px] font-medium leading-none ${badgeColor}`}>
                          {mode.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-[22px] text-[22px] leading-none text-[#7b818a]">
                      {mode.description}
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 rounded-[8px] border border-[#edf0f2] bg-[#fbfcfd] p-[18px]">
                  <ModeDiagram mode={mode.id} />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function SourceCard({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-[286px] w-[428px] flex-col items-center justify-center rounded-[16px] bg-[#f8f9f9] text-center shadow-[0_8px_24px_rgba(20,44,35,0.06)] active:scale-[0.99] active:bg-[#f2f7f5]"
      onClick={onClick}
      type="button"
    >
      <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[20px] bg-white text-[#49bf89] shadow-[0_6px_18px_rgba(20,44,35,0.08)]">
        {icon}
      </div>
      <div className="mt-[30px] text-[30px] font-medium leading-none text-[#202124]">
        {title}
      </div>
    </button>
  );
}

function createMockCapture(role: ImageRole | undefined, index: number): SelectedImage {
  const roleText = role === 'question' ? '题目图片' : role === 'answer' ? '答案图片' : '作业图片';
  const accent = role === 'answer' ? '#6f94f7' : '#58cf9a';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <rect width="320" height="220" rx="18" fill="#f7fafc"/>
      <rect x="28" y="24" width="264" height="172" rx="12" fill="#ffffff" stroke="#d9e1e8" stroke-width="2"/>
      <rect x="54" y="58" width="118" height="20" rx="10" fill="${accent}"/>
      <rect x="54" y="96" width="210" height="12" rx="6" fill="#bae9da"/>
      <rect x="54" y="122" width="170" height="12" rx="6" fill="#c7d7ff"/>
      <rect x="54" y="148" width="198" height="12" rx="6" fill="#c7d7ff"/>
      <text x="66" y="73" fill="#ffffff" font-size="16" font-family="Arial, sans-serif">${roleText}${index}</text>
    </svg>
  `;

  return {
    name: `${roleText}${index}.jpg`,
    role,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

function revokeImageUrls(images: SelectedImage[]) {
  images.forEach((image) => {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  });
}

function appendFilesAsImages(files: File[], role?: ImageRole): SelectedImage[] {
  const rolePrefix = role === 'question' ? '题目' : role === 'answer' ? '答案' : '';

  return files.map((file, index) => ({
    name: rolePrefix ? `${rolePrefix}_${file.name || index + 1}` : file.name,
    role,
    url: URL.createObjectURL(file),
  }));
}

function CameraGrid() {
  return (
    <>
      {[1, 2, 3, 4].map((index) => (
        <div
          key={`v-${index}`}
          className="absolute top-0 h-full w-px bg-white/55"
          style={{ left: `${index * 20}%` }}
        />
      ))}
      {[1, 2, 3].map((index) => (
        <div
          key={`h-${index}`}
          className="absolute left-0 h-px w-full bg-white/55"
          style={{ top: `${index * 25}%` }}
        />
      ))}
    </>
  );
}

function CaptureSimulator({
  title,
  currentRole,
  currentImages,
  questionCount,
  answerCount,
  primaryText,
  primaryDisabled,
  onAlbumSelected,
  onCapture,
  onClose,
  onPrimary,
  onRoleChange,
}: {
  title: string;
  currentRole?: ImageRole;
  currentImages: SelectedImage[];
  questionCount: number;
  answerCount: number;
  primaryText: string;
  primaryDisabled: boolean;
  onAlbumSelected: (files: File[]) => void;
  onCapture: () => void;
  onClose: () => void;
  onPrimary: () => void;
  onRoleChange?: (role: ImageRole) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestImage = currentImages[currentImages.length - 1];

  return (
    <div className="absolute inset-0 z-30 overflow-hidden bg-[#101010]">
      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onAlbumSelected(files.slice(0, 24));
          }
          event.target.value = '';
        }}
        type="file"
      />

      <div className="absolute left-0 top-0 h-full w-[1784px] overflow-hidden bg-[#d8e0df]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#d8e2e1_0%,#f6f7f4_34%,#cbd2ce_64%,#4c302d_100%)]" />
        <div className="absolute left-[-120px] top-[730px] h-[580px] w-[980px] rotate-[-12deg] rounded-[120px] bg-[#5b2d2d]/55 blur-[4px]" />
        <div className="absolute left-[710px] top-[-70px] h-[260px] w-[360px] rotate-[16deg] rounded-[22px] bg-[#267fcc]/45 blur-[1px]" />
        <CameraGrid />
        <div className="absolute left-[360px] top-[210px] h-[690px] w-[930px] rotate-[-12deg] rounded-[6px] border-[4px] border-[#55d99d] bg-white/8" />
        <div className="absolute left-[760px] top-[536px] rounded-[10px] bg-black/45 px-[32px] py-[18px] text-[28px] leading-none text-white">
          保持资料完整清晰
        </div>

        <button
          aria-label="关闭"
          className="absolute left-[31px] top-[45px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-black/70 text-white active:bg-black"
          onClick={onClose}
          type="button"
        >
          <X className="h-[33px] w-[33px]" />
        </button>

        <div className="absolute left-[120px] top-[44px] rounded-full bg-black/45 px-[26px] py-[14px] text-[25px] font-medium leading-none text-white">
          {title}
        </div>

        {currentRole ? (
          <div className="absolute left-1/2 top-[42px] flex -translate-x-1/2 gap-[12px] rounded-full bg-black/35 p-[7px]">
            <button
              className={`h-[44px] rounded-full px-[24px] text-[22px] leading-none ${
                currentRole === 'question' ? 'bg-[#58cf9a] text-white' : 'text-white/82'
              }`}
              onClick={() => onRoleChange?.('question')}
              type="button"
            >
              题目图片 {questionCount}
            </button>
            <button
              className={`h-[44px] rounded-full px-[24px] text-[22px] leading-none ${
                currentRole === 'answer' ? 'bg-[#6f94f7] text-white' : 'text-white/82'
              }`}
              onClick={() => onRoleChange?.('answer')}
              type="button"
            >
              答案图片 {answerCount}
            </button>
          </div>
        ) : null}

        <button
          className="absolute right-[156px] top-[50px] rounded-full bg-black/55 px-[28px] py-[16px] text-[25px] font-medium leading-none text-white"
          type="button"
        >
          拍摄示例
        </button>
      </div>

      <aside className="absolute right-0 top-0 h-full w-[136px] bg-[#1f1f1f]">
        <button
          aria-label="从相册选择"
          className="absolute left-[30px] top-[232px] flex h-[76px] w-[76px] items-center justify-center rounded-full bg-black text-white active:bg-[#303030]"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Images className="h-[38px] w-[38px]" />
        </button>

        <button
          aria-label="拍照"
          className="absolute left-[23px] top-[538px] h-[90px] w-[90px] rounded-full border-[8px] border-white/45 bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.75)] active:scale-95"
          onClick={onCapture}
          type="button"
        />

        <div className="absolute bottom-[38px] left-[18px] h-[86px] w-[102px]">
          {latestImage ? (
            <img
              alt=""
              className="h-[74px] w-[74px] rounded-[9px] border border-white/70 object-cover"
              src={latestImage.url}
            />
          ) : (
            <div className="h-[74px] w-[74px] rounded-[9px] border border-white/35 bg-black/40" />
          )}
          {currentImages.length > 0 ? (
            <span className="absolute right-[15px] top-[-10px] flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-[#58cf9a] px-[8px] text-[17px] font-medium leading-none text-white">
              {currentImages.length}
            </span>
          ) : null}
          <button
            className={`absolute bottom-[-6px] right-0 h-[38px] rounded-full px-[14px] text-[18px] font-medium leading-none text-white ${
              primaryDisabled ? 'bg-[#7a7a7a]' : 'bg-[#58cf9a] active:bg-[#45bf89]'
            }`}
            disabled={primaryDisabled}
            onClick={onPrimary}
            type="button"
          >
            {primaryText}
          </button>
        </div>
      </aside>
    </div>
  );
}

function AddImageDialog({
  onAlbumSelected,
  onCameraOpen,
  onClose,
}: {
  onAlbumSelected: (files: File[]) => void;
  onCameraOpen: () => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-0 z-20 bg-black/55">
      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onAlbumSelected(files.slice(0, 24));
          }
          event.target.value = '';
        }}
        type="file"
      />
      <section className="absolute left-[424px] top-[214px] h-[706px] w-[1072px] rounded-[20px] bg-white shadow-[0_20px_52px_rgba(0,0,0,0.24)]">
        <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#eeeeee]">
          <div className="absolute left-[48px] top-[33px] text-[30px] font-normal leading-none text-[#202124]">
            识别作业资料
          </div>
          <button
            aria-label="关闭"
            className="absolute right-[34px] top-[28px] flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#808080] active:bg-[#f2f2f2] active:text-[#222]"
            onClick={onClose}
            type="button"
          >
            <X className="h-[34px] w-[34px] stroke-[2.2]" />
          </button>
        </header>

        <div className="absolute left-[64px] top-[154px] flex gap-[40px]">
          <SourceCard
            icon={<Images className="h-[42px] w-[42px] stroke-[1.9]" />}
            onClick={() => fileInputRef.current?.click()}
            title="从相册选择"
          />
          <SourceCard
            icon={<Camera className="h-[42px] w-[42px] stroke-[1.9]" />}
            onClick={onCameraOpen}
            title="拍照上传"
          />
        </div>

        <div className="absolute bottom-[80px] left-0 w-full text-center text-[22px] leading-none text-[#8a8f8c]">
          最多可添加24张图片
        </div>
      </section>
    </div>
  );
}

export function TabletAiEntryPreview() {
  const scale = useCanvasScale();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [questionImages, setQuestionImages] = useState<SelectedImage[]>([]);
  const [answerImages, setAnswerImages] = useState<SelectedImage[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMode, setSelectedMode] = useState<RecognitionMode | ''>('');
  const [captureRole, setCaptureRole] = useState<ImageRole>('question');
  const selectedImagesRef = useRef(selectedImages);
  const questionImagesRef = useRef(questionImages);
  const answerImagesRef = useRef(answerImages);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    questionImagesRef.current = questionImages;
  }, [questionImages]);

  useEffect(() => {
    answerImagesRef.current = answerImages;
  }, [answerImages]);

  useEffect(() => () => {
    revokeImageUrls(selectedImagesRef.current);
    revokeImageUrls(questionImagesRef.current);
    revokeImageUrls(answerImagesRef.current);
  }, []);

  const handleAlbumSelected = (files: File[]) => {
    revokeImageUrls(selectedImages);
    setSelectedImages(appendFilesAsImages(files));
    setIsUploadDialogOpen(false);
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
  };

  const handleModeSelect = (mode: RecognitionMode) => {
    revokeImageUrls(selectedImages);
    revokeImageUrls(questionImages);
    revokeImageUrls(answerImages);
    setSelectedImages([]);
    setQuestionImages([]);
    setAnswerImages([]);
    setSelectedSubject('');
    setSelectedMode(mode);
    setIsModeDialogOpen(false);

    if (mode === 'separate_answer') {
      setCaptureRole('question');
    }

    setIsCaptureOpen(true);
  };

  const handleOpenCamera = () => {
    setIsUploadDialogOpen(false);
    setIsCaptureOpen(true);
  };

  const getCurrentCaptureImages = () => {
    if (selectedMode === 'separate_answer') {
      return captureRole === 'question' ? questionImages : answerImages;
    }

    return selectedImages;
  };

  const handleCapture = () => {
    if (selectedMode === 'separate_answer') {
      const updater = captureRole === 'question' ? setQuestionImages : setAnswerImages;
      const currentCount = captureRole === 'question' ? questionImages.length : answerImages.length;
      updater((currentImages) => [
        ...currentImages,
        createMockCapture(captureRole, currentCount + 1),
      ]);
      return;
    }

    setSelectedImages((currentImages) => [
      ...currentImages,
      createMockCapture(undefined, currentImages.length + 1),
    ]);
  };

  const handleCaptureAlbumSelected = (files: File[]) => {
    const nextImages = appendFilesAsImages(
      files,
      selectedMode === 'separate_answer' ? captureRole : undefined,
    );

    if (selectedMode === 'separate_answer') {
      const updater = captureRole === 'question' ? setQuestionImages : setAnswerImages;
      updater((currentImages) => [...currentImages, ...nextImages]);
      return;
    }

    setSelectedImages((currentImages) => [...currentImages, ...nextImages]);
  };

  const handleCapturePrimary = () => {
    if (selectedMode === 'separate_answer') {
      if (captureRole === 'question') {
        setCaptureRole('answer');
        return;
      }

      setSelectedImages([...questionImages, ...answerImages]);
      setIsCaptureOpen(false);
      return;
    }

    setIsCaptureOpen(false);
  };

  const currentCaptureImages = getCurrentCaptureImages();
  const captureTitle = selectedMode === 'separate_answer'
    ? captureRole === 'question'
      ? '拍摄题目图片'
      : '拍摄答案图片'
    : '拍摄作业资料';
  const capturePrimaryText = selectedMode === 'separate_answer'
    ? captureRole === 'question'
      ? '下一步：拍答案'
      : '去选择学科'
    : '去选择学科';
  const capturePrimaryDisabled = currentCaptureImages.length === 0;

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#dfe2e6]">
      <div
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
        }}
      >
        <div
          className="relative origin-top-left overflow-hidden bg-white"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <HomeworkPanel />
          <AiPanel
            onSubjectSelect={handleSubjectSelect}
            onOpenUpload={() => setIsModeDialogOpen(true)}
            selectedImages={selectedImages}
            selectedSubject={selectedSubject}
          />
          {isUploadDialogOpen ? (
            <AddImageDialog
              onAlbumSelected={handleAlbumSelected}
              onCameraOpen={handleOpenCamera}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          ) : null}
          {isModeDialogOpen ? (
            <RecognitionModeDialog
              onClose={() => setIsModeDialogOpen(false)}
              onModeSelect={handleModeSelect}
            />
          ) : null}
          {isCaptureOpen ? (
            <CaptureSimulator
              answerCount={answerImages.length}
              currentImages={currentCaptureImages}
              currentRole={selectedMode === 'separate_answer' ? captureRole : undefined}
              onAlbumSelected={handleCaptureAlbumSelected}
              onCapture={handleCapture}
              onClose={() => setIsCaptureOpen(false)}
              onPrimary={handleCapturePrimary}
              onRoleChange={setCaptureRole}
              primaryDisabled={capturePrimaryDisabled}
              primaryText={capturePrimaryText}
              questionCount={questionImages.length}
              title={captureTitle}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
