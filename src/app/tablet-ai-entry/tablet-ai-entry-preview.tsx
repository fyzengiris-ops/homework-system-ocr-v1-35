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
};

type RecognitionMode = 'questions_only' | 'same_image_answer' | 'separate_answer';

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
      <div className="absolute bottom-0 left-[6px] h-[10px] w-[46px] rounded-full bg-[#d8f2e8]" />
      <div className="absolute left-[9px] top-[8px] h-[38px] w-[43px] rounded-[10px] bg-[#009a65] shadow-sm">
        <div className="absolute -top-[10px] left-[18px] h-[13px] w-[5px] rounded-full bg-[#6bd28f]" />
        <div className="absolute -top-[15px] left-[14px] h-[8px] w-[8px] rounded-full bg-[#72d885]" />
        <div className="absolute left-[9px] top-[12px] h-[9px] w-[7px] rounded-[3px] bg-[#b8f5dd]" />
        <div className="absolute right-[9px] top-[12px] h-[9px] w-[7px] rounded-[3px] bg-[#b8f5dd]" />
        <div className="absolute bottom-[8px] left-[15px] h-[3px] w-[13px] rounded-full bg-[#b8f5dd]" />
      </div>
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
        <div className="mt-[10px] rounded-[4px] bg-[#ff5f60] px-[7px] py-[4px] text-[15px] font-medium leading-none text-white w-fit">
          图片
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
    badge: '同文件',
    description: '适用于题目与答案解析紧挨着出现的资料',
  },
  {
    id: 'separate_answer',
    title: '题目+答案',
    badge: '不同文件',
    description: '适用于题目资料与答案解析资料分开拍摄的场景',
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
                题目{index}
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
          <div className="mb-[10px] text-[16px] font-medium leading-none text-[#475569]">题目1</div>
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
        <QuestionBlock label="题目1" top={42} />
        <QuestionBlock label="题目2" top={134} />
        <QuestionBlock label="题目3" top={226} />
      </SourcePageFrame>
      <ResultPreview rich={false} />
    </div>
  );
}

function SameFileDiagram() {
  return (
    <div className="grid h-full grid-cols-[1.34fr_0.76fr] gap-[18px]">
      <SourcePageFrame>
        <AdjacentAnswerBlock label="题目1+答案/解析" top={42} />
        <AdjacentAnswerBlock label="题目2+答案/解析" top={190} />
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
          <CompactQuestionBlock key={index} label={`题目${index}`} top={72 + itemIndex * 86} />
        ))}
      </CompactFileFrame>
      <CompactFileFrame title="《试卷答案文件》">
        {[1, 2, 3].map((index, itemIndex) => (
          <CompactQuestionBlock
            key={index}
            label={`题目${index}答案解析`}
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
  onModeChange,
  selectedMode,
  selectedSubject,
}: {
  onClose: () => void;
  onModeChange: (mode: RecognitionMode) => void;
  selectedMode: RecognitionMode | '';
  selectedSubject: string;
}) {
  return (
    <div className="absolute inset-0 z-20 bg-[#f0f4f7]">
      <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#e8e8e8] bg-white">
        <div className="absolute left-[48px] top-[33px] text-[30px] font-normal leading-none text-[#202124]">
          识别作业资料
        </div>
      </header>

      <main className="absolute left-0 top-[96px] h-[1002px] w-full">
        <div className="absolute left-0 top-[50px] w-full text-center">
          <h2 className="text-[34px] font-medium leading-none text-[#1f2933]">
            选择识别方式
          </h2>
          <p className="mt-[18px] text-[22px] leading-none text-[#6b7280]">
            建议根据您的资料内容，选择合适的处理流程
          </p>
          <div className="mx-auto mt-[18px] w-fit rounded-full bg-[#eaf7f1] px-[18px] py-[8px] text-[20px] leading-none text-[#31ad76]">
            {selectedSubject}
          </div>
        </div>

        <div className="absolute left-[44px] top-[190px] grid w-[1832px] grid-cols-3 gap-[24px]">
          {recognitionModes.map((mode) => {
            const isSelected = selectedMode === mode.id;
            const iconColor =
              mode.id === 'questions_only'
                ? 'bg-blue-50 text-blue-600'
                : mode.id === 'same_image_answer'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-amber-50 text-amber-600';
            const selectedClass =
              mode.id === 'questions_only'
                ? 'border-blue-400 bg-blue-50/40 shadow-blue-100/70'
                : mode.id === 'same_image_answer'
                  ? 'border-purple-400 bg-purple-50/40 shadow-purple-100/70'
                  : 'border-amber-400 bg-amber-50/40 shadow-amber-100/70';
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
                className={`group flex h-[600px] cursor-pointer flex-col rounded-[16px] border-2 bg-white px-[34px] pb-[32px] pt-[36px] text-left shadow-[0_12px_34px_rgba(31,44,58,0.10)] transition-all active:scale-[0.995] ${
                  isSelected ? selectedClass : 'border-white'
                }`}
                onClick={() => onModeChange(mode.id)}
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
                      {isSelected ? (
                        <span className="rounded-full bg-emerald-50 px-[10px] py-[6px] text-[16px] font-medium leading-none text-emerald-600">
                          已选
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

      <footer className="absolute bottom-0 left-0 h-[102px] w-full border-t border-[#e8e8e8] bg-white">
        <button
          className="absolute bottom-[26px] right-[208px] h-[50px] w-[112px] rounded-[6px] border border-[#d7d7d7] bg-white text-[22px] leading-none text-[#555] active:bg-[#f6f6f6]"
          onClick={onClose}
          type="button"
        >
          返回
        </button>
        <button
          className={`absolute bottom-[26px] right-[54px] h-[50px] w-[124px] rounded-[6px] text-[22px] leading-none text-white ${
            selectedMode ? 'bg-[#58cf9a] active:bg-[#45bf89]' : 'bg-[#c7c7c7]'
          }`}
          disabled={!selectedMode}
          type="button"
        >
          下一步
        </button>
      </footer>
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

function AddImageDialog({
  onAlbumSelected,
  onClose,
}: {
  onAlbumSelected: (files: File[]) => void;
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
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMode, setSelectedMode] = useState<RecognitionMode | ''>('');

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [selectedImages]);

  const handleAlbumSelected = (files: File[]) => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
    setSelectedImages(
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    );
    setIsUploadDialogOpen(false);
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setIsModeDialogOpen(true);
  };

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
            onOpenUpload={() => setIsUploadDialogOpen(true)}
            selectedImages={selectedImages}
            selectedSubject={selectedSubject}
          />
          {isUploadDialogOpen ? (
            <AddImageDialog
              onAlbumSelected={handleAlbumSelected}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          ) : null}
          {isModeDialogOpen ? (
            <RecognitionModeDialog
              onClose={() => setIsModeDialogOpen(false)}
              onModeChange={setSelectedMode}
              selectedMode={selectedMode}
              selectedSubject={selectedSubject}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
