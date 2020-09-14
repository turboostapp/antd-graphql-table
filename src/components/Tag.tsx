import React, { ReactNode } from "react";
import styled from "styled-components";

const Wrapper = styled.span`
  display: inline-flex;
  max-width: 100%;
  margin-right: 8px;
  margin-bottom: 8px;
  height: 28px;
  align-items: center;
  padding-left: 8px;
  background-color: #dfe3e8;
  border-radius: 3px;
  color: #212b36;
`;

const Text = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IconWrapper = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 4px;
  height: 28px;
  width: 28px;
  border-radius: 0 3px 3px 0;
  cursor: pointer;

  &:hover {
    background: #c4cdd5;

    svg {
      fill: #212b36;
    }
  }
`;

const StyledSvg = styled.svg`
  height: 20px;
  width: 20px;
  fill: #637381;
`;

interface TagProps {
  children: ReactNode;
  onClose: () => void;
}

const Tag = ({ children, onClose }: TagProps) => (
  <Wrapper>
    <Text>{children}</Text>
    <IconWrapper onClick={() => onClose()}>
      <StyledSvg
        viewBox="0 0 20 20"
        className="v3ASA"
        focusable="false"
        aria-hidden="true"
      >
        <path
          d="M11.414 10l4.293-4.293a.999.999 0 1 0-1.414-1.414L10 8.586 5.707 4.293a.999.999 0 1 0-1.414 1.414L8.586 10l-4.293 4.293a.999.999 0 1 0 1.414 1.414L10 11.414l4.293 4.293a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L11.414 10z"
          fillRule="evenodd"
        />
      </StyledSvg>
    </IconWrapper>
  </Wrapper>
);

export default Tag;
