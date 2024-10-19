import {useState, useCallback, useRef, useEffect} from "react";

export default function ImageDisplayer() {
  const [prompt, setPrompt] = useState<string>("");
  const [textareaHeight, setTextareaHeight] = useState<string>("40px");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const updateTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 40), 128);
      setTextareaHeight(`${newHeight}px`);
    }
  }, []);

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
      updateTextareaHeight();
    },
    [updateTextareaHeight]
  );

  useEffect(() => {
    updateTextareaHeight();
  }, [prompt, updateTextareaHeight]);

  async function handleGenerate(e: React.MouseEvent<HTMLButtonElement>) {
    setLoading(true);
    setPrompt("");
    e.preventDefault();
    console.log(prompt);
    const response = await fetch("http://localhost:3000", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });
    const imageData = await response.json();
    console.log(imageData);
    setImageUrl(imageData.imageUrl);

    setLoading(false);
  }

  return (
    <div className='min-h-screen flex justify-center items-center'>
      <div className='rounded-md border-gray-800 flex flex-col  items-center w-full min-w-2xl'>
        <div className='p-4 mt-24 '>
          <form className='flex flex-col gap-4'>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              placeholder='Enter a prompt'
              className={` ${loading ? "cursor-not-allowed" : ""}
              min-w-[1000px] rounded-md p-2 pr-24 resize-none overflow-hidden`}
              style={{height: textareaHeight}}
            />
            <button
              onClick={handleGenerate}
              className={` ${
                loading ? "disabled:opacity-10 cursor-not-allowed" : ""
              } bg-blue-500 text-white px-4 py-1 rounded`}>
              {loading ? "Generating..." : "Generate"}
            </button>
          </form>
        </div>
        <div className='flex-1 mb-12'>
          {imageUrl ? (
            <img src={imageUrl} alt='generated Image' className=''></img>
          ) : (
            <div className='flex justify-center items-center py-4 text-md font-semibold'>
              Waiting for the prompt to generate an image
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
