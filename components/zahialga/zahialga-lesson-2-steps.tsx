function StepNum({ n }: { n: number }) {
  return <span className="zah-step-num">{n}</span>;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="zah-phone">
      <div className="zah-scr">{children}</div>
    </div>
  );
}

function OrangeBtn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`zah-ob ${className}`.trim()}>{children}</div>;
}

function Bar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`zah-bar ${className}`.trim()}>{children}</div>;
}

function AppLogo({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <div className={size === "lg" ? "zah-applogo zah-applogo--lg" : "zah-applogo"}>
      淘
    </div>
  );
}

function Zh({ children }: { children: React.ReactNode }) {
  return <span className="zah-zh bs-zh">{children}</span>;
}

export function ZahialgaLesson2Steps() {
  return (
    <div className="zah-steps">
      <div className="zah-step">
        <div className="zah-step-head">
          <StepNum n={1} />
          Апп татах
        </div>
        <PhoneFrame>
          <Bar>🔍 淘宝</Bar>
          <div className="zah-app-row">
            <AppLogo />
            <div className="zah-app-label">Taobao 淘宝</div>
          </div>
          <OrangeBtn>Татах</OrangeBtn>
        </PhoneFrame>
        <div className="zah-cap">
          <b className="bs-zh">淘宝</b> гэж App Store / Play Store-оос хайж тат.
        </div>
      </div>

      <div className="zah-step">
        <div className="zah-step-head">
          <StepNum n={2} />
          Нөхцөл зөвшөөрөх
        </div>
        <PhoneFrame>
          <div className="zah-scr zah-scr--end">
            <div className="zah-terms-box">
              <div className="zah-terms-box-text">үйлчилгээний нөхцөл…</div>
              <OrangeBtn>
                <span className="bs-zh">同意</span>
              </OrangeBtn>
            </div>
          </div>
        </PhoneFrame>
        <div className="zah-cap">
          <Zh>同意</Zh> = <b>Зөвшөөрөх.</b> Зөвшөөрлүүдэд <b className="bs-zh">好的</b>{" "}
          дар.
        </div>
      </div>

      <div className="zah-step">
        <div className="zah-step-head">
          <StepNum n={3} />
          Бүртгэл рүү орох
        </div>
        <PhoneFrame>
          <div className="zah-scr zah-scr--center">
            <AppLogo size="lg" />
            <Bar className="zah-bar--full zah-bar--center">
              <span className="bs-zh">登录</span> Нэвтрэх
            </Bar>
            <OrangeBtn className="zah-ob--full">
              <span className="bs-zh">注册</span>
            </OrangeBtn>
          </div>
        </PhoneFrame>
        <div className="zah-cap">
          <Zh>注册</Zh> = <b>Бүртгүүлэх.</b> Улаан товчийг дар.
        </div>
      </div>

      <div className="zah-step">
        <div className="zah-step-head">
          <StepNum n={4} />
          Дугаар оруулах
        </div>
        <PhoneFrame>
          <Bar>+976 Монгол ▾</Bar>
          <Bar>8800 0000</Bar>
          <div className="zah-check">☑ нөхцөл зөвшөөрөх</div>
          <OrangeBtn>
            <span className="bs-zh">获取验证码</span>
          </OrangeBtn>
        </PhoneFrame>
        <div className="zah-cap">
          Кодоо <b>+976 Монгол</b> болго. <Zh>获取验证码</Zh> = <b>Код авах.</b>
        </div>
      </div>

      <div className="zah-step">
        <div className="zah-step-head">
          <StepNum n={5} />
          Баталгаажуулах
        </div>
        <PhoneFrame>
          <div className="zah-scr">
            <div className="zah-slider-hint">гулсуурыг баруун чир →</div>
            <div className="zah-slider">
              <div className="zah-slider-knob">→</div>
            </div>
            <div className="zah-code-row">
              {["1", "2", "3", "4"].map((d) => (
                <Bar key={d} className="zah-bar--code">
                  {d}
                </Bar>
              ))}
            </div>
          </div>
        </PhoneFrame>
        <div className="zah-cap">
          Гулсуурыг чирч, ирэх <b>6 оронтой кодыг</b> бич.
        </div>
      </div>

      <div className="zah-step">
        <div className="zah-step-head">
          <StepNum n={6} />
          Нууц үг тавих
        </div>
        <PhoneFrame>
          <div className="zah-scr">
            <Bar>••••••••</Bar>
            <div className="zah-check">8–20 тэмдэгт</div>
            <OrangeBtn>
              <span className="bs-zh">设置登录密码</span>
            </OrangeBtn>
            <div className="zah-success">✓ Амжилттай</div>
          </div>
        </PhoneFrame>
        <div className="zah-cap">
          <Zh>设置登录密码</Zh> = <b>Нэвтрэх нууц үг тавих.</b>
        </div>
      </div>
    </div>
  );
}
