import Image from "next/image";

export default function Home() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <Image
        src="/main_page_image.jpg"
        alt="Company Logo"
        width={200}
        height={200}
      />
      <h1 style={{ marginTop: "1rem" }}>Jama Pantel Photography</h1>
    </div>
  );
}